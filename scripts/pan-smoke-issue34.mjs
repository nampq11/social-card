// Interaction smoke for issue #34 T3 (ADR 0005 hybrid pointer model):
// desktop drag-always pan; touch tap-to-select, then pan; [Đặt lại]; and
// unarmed touch Shots leaving gestures native (no touch-action hijack).
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

let vite
const die = async (err) => {
  console.error('SMOKE FAIL:', err.message ?? err)
  chrome.kill()
  vite?.kill()
  process.exit(1)
}
process.on('unhandledRejection', die)

try {
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
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })

  let seq = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++seq
      pending.set(id, (msg) =>
        msg.error ? rej(new Error(`${method}: ${msg.error.message}`)) : res(msg.result),
      )
      ws.send(JSON.stringify({ id, method, params }))
    })
  const evalJs = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (r.exceptionDetails)
      throw new Error('page eval: ' + JSON.stringify(r.exceptionDetails.exception?.description))
    return r.result.value
  }
  const waitUntil = async (label, fn, tries = 60) => {
    for (let i = 0; i < tries; i++) {
      if (await fn()) return
      await sleep(250)
    }
    throw new Error('timeout waiting for ' + label)
  }

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
  await send('DOM.enable')
  // Headless Chrome reports (hover: none) — no pointing device — so the
  // smoke stubs the hover query itself (same approach as the jsdom shim)
  // and flips it via window.__setHover for the touch phase.
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
    const real = window.matchMedia.bind(window)
    const stubs = new Map()
    window.__hoverState = true
    window.matchMedia = (query) => {
      if (query !== '(hover: hover)' && query !== '(hover)') return real(query)
      if (stubs.has(query)) return stubs.get(query)
      const listeners = new Set()
      const mql = {
        matches: window.__hoverState, media: query, onchange: null,
        addEventListener: (_t, cb) => listeners.add(cb),
        removeEventListener: (_t, cb) => listeners.delete(cb),
        addListener: (cb) => listeners.add(cb),
        removeListener: (cb) => listeners.delete(cb),
        dispatchEvent: () => false,
      }
      stubs.set(query, mql)
      window.__setHover = (next) => {
        window.__hoverState = next
        mql.matches = next
        listeners.forEach((cb) => cb({ matches: next, media: query }))
      }
      return mql
    }
  })()`,
  })
  await send('Page.navigate', { url: URL_APP })
  await waitUntil('app boot', () =>
    evalJs(`document.readyState === 'complete' && !!document.querySelector('#social-card-node')`),
  )

  // --- setup: showcase + one cover shot, tour dismissed --------------------
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Bỏ qua'))?.click()`,
  )
  await evalJs(
    `[...document.querySelectorAll('[role=radio]')].find(r => r.textContent.includes('Giới thiệu'))?.click()`,
  )
  await waitUntil('showcase section', () =>
    evalJs(
      `[...document.querySelectorAll('label')].some(l => l.textContent.includes('Ảnh chụp màn hình'))`,
    ),
  )
  await evalJs(`(async () => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 300
    const g = c.getContext('2d')
    g.fillStyle = '#3b82f6'; g.fillRect(0, 0, 900, 300)
    g.fillStyle = '#fff'; g.font = 'bold 64px sans-serif'; g.fillText('PAN TARGET', 240, 170)
    const a = document.createElement('a'); a.href = c.toDataURL()
    window.__fixture = a.href
  })()`)
  const fixture = await evalJs(`window.__fixture`)
  writeFileSync('/tmp/pan-shot.png', Buffer.from(fixture.split(',')[1], 'base64'))
  const pickShot = async () => {
    await send('DOM.getDocument')
    const obj = await send('Runtime.evaluate', {
      expression: `document.querySelector('input[type=file]')`,
      returnByValue: false,
    })
    const { nodeId } = await send('DOM.requestNode', { objectId: obj.result.objectId })
    await send('DOM.setFileInputFiles', { nodeId, files: ['/tmp/pan-shot.png'] })
  }
  await pickShot()
  await waitUntil('hero shot', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )

  const heroImg = `document.querySelector('[data-testid=hero-slot] img.object-cover')`
  const position = () => evalJs(`${heroImg}?.style.objectPosition ?? null`)
  const centerOf = async () =>
    evalJs(`(() => {
    const r = ${heroImg}.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })()`)

  // --- 1. desktop: drag pans immediately, no selection chrome ---------------
  if (!(await evalJs(`matchMedia('(hover: hover)').matches`)))
    throw new Error('expected hover-capable desktop')
  let pos = await position()
  let c = await centerOf()
  const mouse = (type, x, y) =>
    send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: 'left',
      buttons: type === 'mouseMoved' ? 1 : 0,
      pointerType: 'mouse',
    })
  await mouse('mousePressed', c.x, c.y)
  for (let step = 1; step <= 10; step++) await mouse('mouseMoved', c.x - step * 6, c.y - step * 2)
  await mouse('mouseReleased', c.x - 60, c.y - 20)
  await sleep(300)
  const afterDesktopDrag = await position()
  if (afterDesktopDrag === pos) throw new Error('desktop drag did not pan the shot')
  console.log('1. desktop drag pans ✓', pos, '→', afterDesktopDrag)
  if (await evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`))
    throw new Error('desktop path must not show selection chrome')

  // --- 2. touch phase: flip the hover capability off ------------------------
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await evalJs(`window.__setHover(false)`)
  await sleep(400)
  if (await evalJs(`matchMedia('(hover: hover)').matches`))
    throw new Error('touch phase did not flip hover media')

  // --- 3. unarmed touch drag does NOT pan and claims no touch-action -------
  pos = await position()
  c = await centerOf()
  const touchPoint = (type, x, y) =>
    send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  const touchNone = () => evalJs(`${heroImg}.className.includes('touch-none')`)
  if (await touchNone()) throw new Error('unarmed shot must not claim touch-action')
  await touchPoint('touchStart', c.x, c.y)
  for (let step = 1; step <= 8; step++) await touchPoint('touchMove', c.x + step * 8, c.y)
  await touchPoint('touchEnd', c.x + 64, c.y)
  await sleep(300)
  if ((await position()) !== pos) throw new Error('unarmed touch drag must not pan')
  console.log('2. unarmed touch drag leaves the gesture native ✓')

  // --- 4. tap selects, armed drag pans, [Đặt lại] restores ------------------
  c = await centerOf()
  await touchPoint('touchStart', c.x, c.y)
  await touchPoint('touchEnd', c.x, c.y)
  await waitUntil('selection overlay', () =>
    evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`),
  )
  if (!(await touchNone())) throw new Error('armed shot must claim touch-action')
  console.log('3. tap selects + arms the gesture surface ✓')

  pos = await position()
  c = await centerOf()
  await touchPoint('touchStart', c.x, c.y)
  for (let step = 1; step <= 10; step++) await touchPoint('touchMove', c.x - step * 5, c.y)
  await touchPoint('touchEnd', c.x - 50, c.y)
  await sleep(300)
  const afterTouchPan = await position()
  if (afterTouchPan === pos) throw new Error('armed touch drag did not pan')
  console.log('4. armed touch drag pans ✓', pos, '→', afterTouchPan)

  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Đặt lại'))?.click()`,
  )
  await sleep(300)
  if ((await position()) !== '50% 0%')
    throw new Error('[Đặt lại] did not restore the default focus')
  console.log('5. [Đặt lại] restores the default focus ✓')

  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Xong'))?.click()`,
  )
  await waitUntil(
    'overlay gone',
    async () => !(await evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`)),
  )
  if (await touchNone()) throw new Error('disarmed shot must release touch-action')
  console.log('6. [Xong] disarms and releases touch-action ✓')

  writeFileSync(
    '/tmp/pan-smoke-final.png',
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
  )
  console.log('SMOKE OK: hybrid pointer model verified end to end')
} catch (err) {
  await die(err)
} finally {
  chrome.kill()
  if (vite?.pid)
    try {
      process.kill(-vite.pid)
    } catch {}
}
