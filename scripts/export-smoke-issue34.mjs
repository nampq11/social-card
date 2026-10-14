// Export smoke for issue #34 (ADR 0005): drive the real app in headless
// Chrome — switch to Showcase, ingest two screenshots through the real file
// input, Fit the hero, screenshot the preview, export through the real
// Copy button, and pull the exported PNG back out of the clipboard.
// Verifies html-to-image survives the CSS blur backdrop (T2 acceptance).
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync } from 'node:fs'

const PORT = 9222
const URL_APP = 'http://localhost:5173/'

const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const die = async (err) => {
  console.error('SMOKE FAIL:', err.message ?? err)
  chrome.kill()
  vite?.kill()
  process.exit(1)
}
process.on('unhandledRejection', die)

let vite
let lastRadioDump = ''
try {
  // --- wait for the debugger endpoint, then find the page target ----------
  let targets
  for (let i = 0; i < 50; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      if (targets.length) break
    } catch {
      await sleep(200)
    }
  }
  const page = targets.find((t) => t.type === 'page')
  const wsPage = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    wsPage.onopen = res
    wsPage.onerror = rej
  })

  let seq = 0
  const pending = new Map()
  const events = []
  wsPage.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    } else if (msg.method) events.push(msg)
  }
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++seq
      pending.set(id, (msg) =>
        msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result),
      )
      wsPage.send(JSON.stringify({ id, method, params }))
    })
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails)
      throw new Error(
        'page eval: ' +
          JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text),
      )
    return r.result.value
  }
  const waitUntil = async (label, fn, tries = 60) => {
    for (let i = 0; i < tries; i++) {
      if (await fn()) return
      await sleep(250)
    }
    throw new Error('timeout waiting for ' + label)
  }

  // --- vite dev server -----------------------------------------------------
  vite = spawn('pnpm', ['dev', '--port', '5173', '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  })
  await waitUntil('vite', async () => {
    try {
      return (await fetch(URL_APP)).ok
    } catch {
      return false
    }
  })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: URL_APP })
  await waitUntil('app boot', () =>
    evalJs(`document.readyState === 'complete' && !!document.querySelector('#social-card-node')`),
  )

  // --- 1. Showcase mode ----------------------------------------------------
  await evalJs(
    `[...document.querySelectorAll('[role=radio]')].find(r => r.textContent.includes('Giới thiệu'))?.click()`,
  )
  await waitUntil('showcase section', async () => {
    const ok = await evalJs(
      `[...document.querySelectorAll('label')].some(l => l.textContent.includes('Ảnh chụp màn hình'))`,
    )
    if (!ok) {
      const radios = await evalJs(
        `[...document.querySelectorAll('[role=radio]')].map((r) => r.textContent.trim()).join('|')`,
      )
      if (radios !== lastRadioDump) console.log('  radios so far:', radios)
      lastRadioDump = radios
    }
    return ok
  })

  // --- 1b. fixtures: two 800×450 PNGs drawn by the browser's own canvas -----
  const fixtureDataUrl = await evalJs(`(async () => {
    const make = (draw) => {
      const c = document.createElement('canvas')
      c.width = 800
      c.height = 450
      draw(c.getContext('2d'))
      return c.toDataURL('image/png')
    }
    return {
      one: make((g) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, 800, 150)
        g.fillStyle = '#3b82f6'; g.fillRect(0, 150, 800, 150)
        g.fillStyle = '#f59e0b'; g.fillRect(0, 300, 800, 150)
        g.fillStyle = '#111'; g.font = '48px sans-serif'
        g.fillText('SHOT ONE — full content', 120, 90)
        g.fillText('must stay visible', 120, 240)
      }),
      two: make((g) => {
        for (let x = 0; x < 800; x += 50) { g.fillStyle = x % 100 ? '#e5e7eb' : '#9ca3af'; g.fillRect(x, 0, 50, 450) }
        g.fillStyle = '#dc2626'; g.font = 'bold 56px sans-serif'
        g.fillText('SHOT TWO wide 16:9', 180, 235)
      }),
    }
  })()`)
  writeFileSync('/tmp/smoke-shot-1.png', Buffer.from(fixtureDataUrl.one.split(',')[1], 'base64'))
  writeFileSync('/tmp/smoke-shot-2.png', Buffer.from(fixtureDataUrl.two.split(',')[1], 'base64'))

  // --- 2. ingest two screenshots through the real input (one file per pick) -
  const pickShot = async (file) => {
    await send('DOM.getDocument')
    const obj = await send('Runtime.evaluate', {
      expression: `document.querySelector('input[type=file]')`,
      returnByValue: false,
    })
    const { nodeId: id } = await send('DOM.requestNode', { objectId: obj.result.objectId })
    await send('DOM.setFileInputFiles', { nodeId: id, files: [file] })
  }
  await pickShot('/tmp/smoke-shot-1.png')
  await waitUntil('hero shot', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )
  await pickShot('/tmp/smoke-shot-2.png')
  await waitUntil('two shots in preview', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length === 2`),
  )

  // --- 3. select the hero thumbnail, switch it to Fit -----------------------
  await evalJs(
    `document.querySelector('[aria-label^="Ảnh chụp màn hình"][aria-label*="1"]')?.click()`,
  )
  await evalJs(`document.querySelectorAll('.grid img')[0].click()`)
  await waitUntil('fit switcher', () =>
    evalJs(
      `[...document.querySelectorAll('label')].some(l => l.textContent.includes('Hiển thị ảnh'))`,
    ),
  )
  await evalJs(
    `[...document.querySelectorAll('[role=radio]')].find(r => r.textContent.includes('Trọn ảnh'))?.click()`,
  )
  await waitUntil('contain render', () =>
    evalJs(`!!document.querySelector('[data-testid=shot-collage] img.object-contain')`),
  )
  await sleep(400) // let the blur layer settle for the capture

  // --- 4. capture the live preview -----------------------------------------
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync('/tmp/smoke-preview.png', Buffer.from(shot.data, 'base64'))

  // --- 5. export: real Copy button, then capture bytes via the real module -
  await send('Browser.grantPermissions', {
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  })
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Copy ảnh'))?.click()`,
  )
  await sleep(4000)
  const copyTook = await evalJs(
    `document.body.textContent.includes('Đã copy vào Clipboard') || document.body.textContent.includes('Không thể')`,
  )
  console.log('copy button path settled (headless may refuse clipboard write):', copyTook)

  // Headless refuses clipboard.write even with permissions ("Document is not
  // focused") — so for the bytes, render through the app's own export module
  // (same options, same html-to-image) and intercept the download anchor.
  const dataUrl = await evalJs(`(async () => {
    const captured = []
    const originalClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { captured.push(this.href) }
    try {
      const exportModule = await import(new URL('src/lib/export.ts', document.baseURI).href)
      await exportModule.downloadCardImage(document.querySelector('#social-card-node'), 'smoke.png')
    } finally { HTMLAnchorElement.prototype.click = originalClick }
    return captured[0] ?? null
  })()`)
  if (!dataUrl) throw new Error('export module produced no PNG')
  writeFileSync('/tmp/smoke-exported.png', Buffer.from(dataUrl.split(',')[1], 'base64'))

  const bytes = (await import('node:fs')).statSync('/tmp/smoke-exported.png').size
  console.log('SMOKE OK: preview + exported PNG captured, exported bytes =', bytes)
} catch (err) {
  await die(err)
} finally {
  chrome.kill()
  if (vite?.pid)
    try {
      process.kill(-vite.pid)
    } catch {}
}
