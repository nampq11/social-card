// Headless-Chrome smoke for the single onboarding tour: drives the real app
// — dismiss the welcome card, switch to Showcase, ingest a screenshot through
// the real file input — and verifies the tour contract end to end:
//   1. nothing ever auto-opens the tour at the first Shot (no mid-task
//      interruption — the welcome card and Tips replay are the only entries);
//   2. a Tips replay opens the ONE tour: four basics steps, plus the two
//      Showcase gesture steps while a Shot exists (6 total), and it navigates;
//   3. finishing closes it and a reload never resurrects it unbidden;
//   4. the replayed tour stays open past the popover's focus-return window.
import { writeFileSync } from 'node:fs'
import { openShowcase, pickShot, runSmoke, sleep } from './lib/smoke-app.mjs'

const GESTURE_STEP_TITLE = 'Ảnh của bạn điều khiển được'

await runSmoke({}, async (app) => {
  const { evalJs, waitUntil } = app
  const assert = (ok, label) => {
    if (!ok) throw new Error('assert failed: ' + label)
  }

  // --- 1. clear the welcome gate (first-run onboarding done), go Showcase --
  assert(
    await evalJs(
      `[...document.querySelectorAll('button')].some(b => b.textContent.includes('Bỏ qua'))`,
    ),
    'welcome card visible on first run',
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Bỏ qua, dùng ngay'))?.click()`,
  )
  await openShowcase(app)

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
  await pickShot(app, '/tmp/smoke-shot-tour.png')
  await waitUntil('hero shot', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )

  // --- 3. no auto-interrupt: the first Shot must NOT open any tour ---------
  await sleep(600) // give any (wrongful) auto-fire a window to appear
  assert(
    !(await evalJs(`document.body.innerText.includes('${GESTURE_STEP_TITLE}')`)),
    'no tour auto-opens at the first Shot',
  )

  // --- 4. Tips replay opens the one tour, now six steps --------------------
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Gợi ý đăng bài' || b.title === 'Gợi ý đăng bài')?.click()`,
  )
  await waitUntil('tips popover', () =>
    evalJs(`document.body.innerText.includes('Xem lại hướng dẫn')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Xem lại hướng dẫn'))?.click()`,
  )
  await waitUntil('tour step 1', () =>
    evalJs(`document.body.innerText.includes('Ảnh xem trước trực tiếp')`),
  )
  assert(await evalJs(`document.body.innerText.includes('1 / 6')`), 'step 1 of 6 shown')

  // evidence artifact, same pattern as the export smoke's /tmp captures
  const shot = await app.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync('/tmp/tour-smoke-step1.png', Buffer.from(shot.data, 'base64'))

  // --- 5. walk to the gesture steps (5, 6) and finish ----------------------
  for (let step = 2; step <= 5; step++) {
    await evalJs(
      `[...document.querySelectorAll('button')].find(b => b.textContent === 'Tiếp')?.click()`,
    )
    await waitUntil(`step ${step} of 6`, () =>
      evalJs(`document.body.innerText.includes('${step} / 6')`),
    )
  }
  await waitUntil('gesture step', () =>
    evalJs(`document.body.innerText.includes('${GESTURE_STEP_TITLE}')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent === 'Tiếp')?.click()`,
  )
  await waitUntil('fit override step', () =>
    evalJs(`document.body.innerText.includes('Chọn cách hiển thị từng ảnh')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent === 'Xong')?.click()`,
  )
  await waitUntil('tour closed', () =>
    evalJs(`!document.body.innerText.includes('Chọn cách hiển thị từng ảnh')`),
  )

  // --- 6. persistence: reload, re-arm a Shot — the tour must stay dead -----
  await app.send('Page.reload')
  await waitUntil('app reboot', () => evalJs(`!!document.querySelector('#social-card-node')`))
  await waitUntil('inspector radios', () => evalJs(`!!document.querySelector('[role=radio]')`))
  await openShowcase(app)
  await pickShot(app, '/tmp/smoke-shot-tour.png')
  await waitUntil('hero shot again', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )
  await sleep(600) // give any (wrongful) auto-fire a window to appear
  assert(
    !(await evalJs(`document.body.innerText.includes('${GESTURE_STEP_TITLE}')`)),
    'tour stays dead after reload (onboarding done, shot re-armed)',
  )

  console.log('SMOKE OK: one tour — no auto-fire, replay shows 6 steps with a Shot, persists')
})
