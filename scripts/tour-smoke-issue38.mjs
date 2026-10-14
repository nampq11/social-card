// Headless-Chrome smoke for the shot-gestures onboarding tour (issue #38):
// drives the real app — dismiss the welcome card, switch to Showcase, ingest
// a screenshot through the real file input — and verifies the tour contract
// end to end:
//   1. the tour auto-fires exactly once, at the first Shot;
//   2. both steps resolve their anchors (hero slot, Inspector) and navigate;
//   3. finishing persists — a reload never replays it;
//   4. the Tips popover offers the replay, which reopens the tour.
import { writeFileSync } from 'node:fs'
import { startSmokeApp, sleep } from './lib/smoke-app.mjs'

const assert = (ok, label) => {
  if (!ok) throw new Error('assert failed: ' + label)
}

let app
try {
  app = await startSmokeApp()
  const { evalJs, waitUntil } = app

  // --- 1. clear the welcome gate (first-run onboarding done), go Showcase --
  assert(
    await evalJs(
      `[...document.querySelectorAll('button')].some(b => b.textContent.includes('Bỏ qua'))`,
    ),
    'welcome card visible on first run',
  )
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

  // --- 2. fixture + ingest one screenshot through the real file input ------
  const fixtureDataUrl = await evalJs(`(async () => {
    const c = document.createElement('canvas')
    c.width = 800
    c.height = 450
    const g = c.getContext('2d')
    g.fillStyle = '#3b82f6'; g.fillRect(0, 0, 800, 450)
    g.fillStyle = '#fff'; g.font = '48px sans-serif'
    g.fillText('TOUR SMOKE — drag me', 180, 235)
    return c.toDataURL('image/png')
  })()`)
  writeFileSync('/tmp/smoke-shot-tour.png', Buffer.from(fixtureDataUrl.split(',')[1], 'base64'))
  // DOM.setFileInputFiles needs a CDP node handle, same as the export smoke:
  await (async () => {
    await app.send('DOM.getDocument')
    const obj = await app.send('Runtime.evaluate', {
      expression: `document.querySelector('input[type=file]')`,
      returnByValue: false,
    })
    const { nodeId: id } = await app.send('DOM.requestNode', { objectId: obj.result.objectId })
    await app.send('DOM.setFileInputFiles', { nodeId: id, files: ['/tmp/smoke-shot-tour.png'] })
  })()
  await waitUntil('hero shot', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )

  // --- 3. the tour auto-fired at the first Shot: step 1 on the hero slot ---
  await waitUntil('tour step 1', () =>
    evalJs(`document.body.innerText.includes('Ảnh của bạn điều khiển được')`),
  )
  assert(await evalJs(`document.body.innerText.includes('1 / 2')`), 'step 1 of 2 shown')

  // evidence artifact, same pattern as the export smoke's /tmp captures
  const shot = await app.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync('/tmp/tour-smoke-step1.png', Buffer.from(shot.data, 'base64'))

  // --- 4. next reaches the Fit override step; Xong closes the tour ---------
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent === 'Tiếp')?.click()`,
  )
  await waitUntil('tour step 2', () =>
    evalJs(`document.body.innerText.includes('Chọn cách hiển thị từng ảnh')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent === 'Xong')?.click()`,
  )
  await waitUntil('tour closed', () =>
    evalJs(`!document.body.innerText.includes('Chọn cách hiển thị từng ảnh')`),
  )

  // --- 5. Tips popover recall (a Shot exists): the entry reopens the tour --
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Gợi ý đăng bài' || b.title === 'Gợi ý đăng bài')?.click()`,
  )
  await waitUntil('tips popover', () =>
    evalJs(`document.body.innerText.includes('Thao tác trên ảnh')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Thao tác trên ảnh'))?.click()`,
  )
  await waitUntil('tour replayed', () =>
    evalJs(`document.body.innerText.includes('Ảnh của bạn điều khiển được')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent === 'Bỏ qua')?.click()`,
  )
  await waitUntil('replay closed', () =>
    evalJs(`!document.body.innerText.includes('Ảnh của bạn điều khiển được')`),
  )

  // --- 6. persistence: reload, re-arm a Shot — the tour must stay dead -----
  await app.send('Page.reload')
  await waitUntil('app reboot', () => evalJs(`!!document.querySelector('#social-card-node')`))
  await evalJs(
    `[...document.querySelectorAll('[role=radio]')].find(r => r.textContent.includes('Giới thiệu'))?.click()`,
  )
  await waitUntil('showcase again', () => evalJs(`!!document.querySelector('input[type=file]')`))
  await (async () => {
    await app.send('DOM.getDocument')
    const obj = await app.send('Runtime.evaluate', {
      expression: `document.querySelector('input[type=file]')`,
      returnByValue: false,
    })
    const { nodeId: id } = await app.send('DOM.requestNode', { objectId: obj.result.objectId })
    await app.send('DOM.setFileInputFiles', { nodeId: id, files: ['/tmp/smoke-shot-tour.png'] })
  })()
  await waitUntil('hero shot again', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )
  await sleep(600) // give any (wrongful) auto-fire a window to appear
  assert(
    !(await evalJs(`document.body.innerText.includes('Ảnh của bạn điều khiển được')`)),
    'tour stays dead after reload (status done, shot re-armed)',
  )

  console.log('SMOKE OK: shot-fit tour fires once, navigates, persists, and recalls')
  app.close()
  process.exit(0)
} catch (err) {
  console.error('SMOKE FAIL:', err.message)
  app?.close()
  process.exit(1)
}
