// Shared headless-Chrome harness for the smoke scripts: boots Chrome with a
// DevTools debugger port, starts the vite dev server, connects over the
// DevTools protocol, and hands back tiny send/eval/wait helpers plus a
// close() that tears both processes down. Everything a scenario needs beyond
// its own steps — file ingest, showcase entry, export interception, CDP
// input dispatch, the run/teardown wrapper — lives here too.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = 9222
// The studio lives at /social-card/studio since the landing took the bare
// app path as the front door — smokes exercise the studio, so they follow.
const URL_APP = 'http://localhost:5173/social-card/studio'

export { sleep }

// Headless Chrome reports (hover: none) — no pointing device. Scripts that
// exercise the hover/touch split stub the hover query itself (same approach
// as the jsdom shim) and flip it via window.__setHover for the touch phase.
export const HOVER_STUB = `(() => {
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
})()`

// newDocumentScripts run before any page script — the place for matchMedia
// stubs and other capabilities headless Chrome lacks.
export async function startSmokeApp({ newDocumentScripts = [] } = {}) {
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
  // Vite and Chrome boot independently — start both up front so the waits
  // below overlap with the spawns instead of serializing them.
  const vite = spawn('pnpm', ['dev', '--port', '5173', '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  })
  const close = () => {
    chrome.kill()
    if (vite.pid)
      try {
        process.kill(-vite.pid)
      } catch {}
  }
  const die = (err) => {
    console.error('SMOKE FAIL:', err.message ?? err)
    close()
    process.exit(1)
  }
  process.on('unhandledRejection', die)

  try {
    let targets
    for (let i = 0; i < 50; i++) {
      try {
        targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
        if (targets.length) break
      } catch {}
      // Pace every non-winning iteration — an empty target list must not
      // spin the retry budget away in a burst of back-to-back fetches.
      await sleep(200)
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
    for (const source of newDocumentScripts)
      await send('Page.addScriptToEvaluateOnNewDocument', { source })
    await send('Page.navigate', { url: URL_APP })
    await waitUntil('app boot', () =>
      evalJs(`document.readyState === 'complete' && !!document.querySelector('#social-card-node')`),
    )

    return { send, evalJs, waitUntil, close }
  } catch (err) {
    close()
    throw err
  }
}

// Ingests a real file through the page's real file input: CDP's
// DOM.setFileInputFiles addresses the input by node id, so resolve it first.
export async function pickShot(app, file) {
  await app.send('DOM.getDocument')
  const obj = await app.send('Runtime.evaluate', {
    expression: `document.querySelector('input[type=file]')`,
    returnByValue: false,
  })
  const { nodeId } = await app.send('DOM.requestNode', { objectId: obj.result.objectId })
  await app.send('DOM.setFileInputFiles', { nodeId, files: [file] })
}

// The shared scenario opening: dismiss the first-run welcome card (the
// optional chain makes it a no-op when absent), switch the mode radio to
// Showcase, and wait for the section to render.
export async function openShowcase(app) {
  await app.evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Bỏ qua'))?.click()`,
  )
  await app.evalJs(
    `[...document.querySelectorAll('[role=radio]')].find(r => r.textContent.includes('Giới thiệu'))?.click()`,
  )
  await app.waitUntil('showcase section', () =>
    app.evalJs(
      `[...document.querySelectorAll('label')].some(l => l.textContent.includes('Ảnh chụp màn hình'))`,
    ),
  )
}

// The factory card ships a Showcase holding the demo Shot. Smokes that
// drive their own hero-ratio fixtures need the collage empty first —
// delete through the real per-thumbnail delete buttons so the flow stays
// user-real.
export async function clearShots(app) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const deleted = await app.evalJs(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b =>
        (b.getAttribute('aria-label') || b.textContent).includes('Xóa ảnh'))
      if (!btn) return false
      btn.click()
      return true
    })()`)
    if (!deleted) return
    await sleep(250)
  }
  throw new Error('clearShots: the delete button never went away')
}

// Exports the card through the app's own export module (same options, same
// html-to-image as the real Copy path) and intercepts the download anchor,
// returning the PNG data URL.
export async function exportCard(app) {
  return app.evalJs(`(async () => {
    const captured = []
    const originalClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { captured.push(this.href) }
    try {
      const exportModule = await import(new URL('src/lib/export.ts', document.baseURI).href)
      await exportModule.downloadCardImage(document.querySelector('#social-card-node'), 'smoke.png')
    } finally { HTMLAnchorElement.prototype.click = originalClick }
    return captured[0] ?? null
  })()`)
}

// Dispatches one raw CDP mouse event. `buttons` is the pressed-button
// bitmask (1 while a drag is in progress); `clickCount` marks multi-clicks.
export function mouseEvent(app, type, x, y, { buttons = 0, clickCount = 1 } = {}) {
  return app.send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: 'left',
    buttons,
    clickCount,
    pointerType: 'mouse',
  })
}

// Dispatches one raw CDP touch event; each point carries a stable id so
// multi-finger gestures track across moves.
export function touchEvent(app, type, points) {
  return app.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : points.map((p) => ({ x: p.x, y: p.y, id: p.id ?? 1 })),
  })
}

// Owns the smoke lifecycle — boot, failure reporting, exit code, teardown —
// so a scenario file contains only scenario steps.
export async function runSmoke(startOptions, scenario) {
  let app
  try {
    app = await startSmokeApp(startOptions)
    await scenario(app)
  } catch (err) {
    console.error('SMOKE FAIL:', err.message ?? err)
    process.exitCode = 1
  } finally {
    app?.close()
  }
}
