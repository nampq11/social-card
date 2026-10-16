#!/usr/bin/env bash
set -euo pipefail

# Measure web performance of social-card production build
node -e "
import('node:fs').then(async (fs) => {
  import('node:zlib').then(async (zlib) => {
    import('node:path').then(async (path) => {
      import('node:http').then(async (http) => {
        import('node:child_process').then(async ({ spawn, execSync }) => {
          const { setTimeout: sleep } = await import('node:timers/promises');

          // 1. Production build
          const t0 = performance.now();
          execSync('pnpm build', { stdio: 'pipe' });
          const tBuild = performance.now();

          // 2. Measure bundle assets
          const assets = fs.readdirSync('dist/assets');
          const jsFiles = assets.filter(f => f.endsWith('.js'));
          const cssFiles = assets.filter(f => f.endsWith('.css'));

          const html = fs.readFileSync('dist/index.html', 'utf8');
          const match = html.match(/src=\"\/social-card\/assets\/(index-[^\"]+\.js)\"/);
          const entryJsFile = match ? match[1] : jsFiles[0];

          const entryJsBuf = fs.readFileSync(path.join('dist/assets', entryJsFile));
          const entryJsKb = (entryJsBuf.length / 1024).toFixed(2);
          const entryGzipKb = (zlib.gzipSync(entryJsBuf).length / 1024).toFixed(2);

          let totalJsBytes = 0;
          let totalGzipBytes = 0;
          for (const f of jsFiles) {
            const buf = fs.readFileSync(path.join('dist/assets', f));
            totalJsBytes += buf.length;
            totalGzipBytes += zlib.gzipSync(buf).length;
          }
          const totalJsKb = (totalJsBytes / 1024).toFixed(2);
          const totalGzipKb = (totalGzipBytes / 1024).toFixed(2);

          let totalCssGzip = 0;
          for (const f of cssFiles) {
            const buf = fs.readFileSync(path.join('dist/assets', f));
            totalCssGzip += zlib.gzipSync(buf).length;
          }
          const cssGzipKb = (totalCssGzip / 1024).toFixed(2);

          // 3. Measure real browser mount time via Headless Chrome
          const port = 4170 + Math.floor(Math.random() * 200);
          const cdpPort = 9230 + Math.floor(Math.random() * 200);
          const mime = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.woff2': 'font/woff2',
            '.woff': 'font/woff'
          };

          const server = http.createServer((req, res) => {
            let p = req.url.replace('/social-card', '');
            if (p === '/' || p === '') p = '/index.html';
            const file = path.join('dist', p.split('?')[0]);
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
              const ext = path.extname(file);
              res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
              fs.createReadStream(file).pipe(res);
            } else {
              res.setHeader('Content-Type', 'text/html');
              fs.createReadStream('dist/index.html').pipe(res);
            }
          });

          await new Promise(r => server.listen(port, r));

          const chrome = spawn('google-chrome', [
            '--headless=new',
            '--no-sandbox',
            '--disable-gpu',
            \`--remote-debugging-port=\${cdpPort}\`,
            'about:blank'
          ], { stdio: 'ignore' });

          await sleep(250);

          let targets = [];
          for (let i = 0; i < 20; i++) {
            try {
              targets = await (await fetch(\`http://127.0.0.1:\${cdpPort}/json/list\`)).json();
              if (targets.length) break;
            } catch {}
            await sleep(100);
          }

          const page = targets.find(t => t.type === 'page');
          let medianMount = 0;
          let domNodes = 0;

          if (page) {
            const ws = new WebSocket(page.webSocketDebuggerUrl);
            await new Promise(r => ws.onopen = r);

            let id = 1;
            const send = (method, params = {}) => new Promise((resolve) => {
              const cur = id++;
              const handler = (e) => {
                const data = JSON.parse(e.data);
                if (data.id === cur) {
                  ws.removeEventListener('message', handler);
                  resolve(data.result);
                }
              };
              ws.addEventListener('message', handler);
              ws.send(JSON.stringify({ id: cur, method, params }));
            });

            await send('Page.enable');

            const mountTimes = [];
            for (let i = 0; i < 3; i++) {
              const tStart = performance.now();
              await send('Page.navigate', { url: \`http://localhost:\${port}/social-card/?bench=\${i}\` });
              for (let step = 0; step < 80; step++) {
                const res = await send('Runtime.evaluate', {
                  expression: '!!document.querySelector(\"#social-card-node\")'
                });
                if (res?.result?.value) break;
                await sleep(10);
              }
              mountTimes.push(performance.now() - tStart);
            }
            mountTimes.sort((a,b) => a - b);
            medianMount = mountTimes[1];

            const domCountRes = await send('Runtime.evaluate', {
              expression: 'document.querySelectorAll(\"*\").length'
            });
            domNodes = domCountRes?.result?.value || 0;

            ws.close();
          }

          chrome.kill();
          server.close();

          console.log('METRIC entry_js_kb=' + entryJsKb);
          console.log('METRIC entry_gzip_kb=' + entryGzipKb);
          console.log('METRIC total_js_kb=' + totalJsKb);
          console.log('METRIC total_gzip_kb=' + totalGzipKb);
          console.log('METRIC css_gzip_kb=' + cssGzipKb);
          console.log('METRIC mount_ms=' + medianMount.toFixed(0));
          console.log('METRIC dom_nodes=' + domNodes);
          console.log('METRIC build_ms=' + (tBuild - t0).toFixed(0));
        });
      });
    });
  });
});
"
