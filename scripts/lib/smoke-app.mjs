// Shared headless-Chrome harness for the smoke scripts (issue #34): boots
// Chrome with a DevTools debugger port, starts the vite dev server, connects
// over the DevTools protocol, and hands back tiny send/eval/wait helpers plus
// a close() that tears both processes down.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = 9222
const URL_APP = 'http://localhost:5173/'

export { sleep }

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

  let vite
  const close = () => {
    chrome.kill()
    if (vite?.pid)
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
    for (const source of newDocumentScripts)
      await send('Page.addScriptToEvaluateOnNewDocument', { source })
    await send('Page.navigate', { url: URL_APP })
    await waitUntil('app boot', () =>
      evalJs(`document.readyState === 'complete' && !!document.querySelector('#social-card-node')`),
    )

    return { send, evalJs, waitUntil, sleep, close }
  } catch (err) {
    close()
    throw err
  }
}
