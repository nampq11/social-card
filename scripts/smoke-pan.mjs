// Interaction smoke for issue #34 T3 (ADR 0005 hybrid pointer model):
// desktop drag-always pan; touch tap-to-select, then pan; [Đặt lại]; and
// unarmed touch Shots leaving gestures native (no touch-action hijack —
// asserted on the real computed style, not on class tokens).
import { writeFileSync } from 'node:fs'
import {
  HOVER_STUB,
  mouseEvent,
  openShowcase,
  pickShot,
  runSmoke,
  sleep,
  touchEvent,
} from './lib/smoke-app.mjs'

await runSmoke({ newDocumentScripts: [HOVER_STUB] }, async (app) => {
  const { send, evalJs, waitUntil } = app

  // --- setup: showcase + one cover shot, tour dismissed --------------------
  await openShowcase(app)
  const fixture = await evalJs(`(async () => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 300
    const g = c.getContext('2d')
    g.fillStyle = '#3b82f6'; g.fillRect(0, 0, 900, 300)
    g.fillStyle = '#fff'; g.font = 'bold 64px sans-serif'; g.fillText('PAN TARGET', 240, 170)
    return c.toDataURL()
  })()`)
  writeFileSync('/tmp/pan-shot.png', Buffer.from(fixture.split(',')[1], 'base64'))
  await pickShot(app, '/tmp/pan-shot.png')
  await waitUntil('hero shot', () =>
    evalJs(`document.querySelectorAll('[data-testid=shot-collage] img').length >= 1`),
  )

  // Since ADR 0006 a shot's fit derives from its ratio against the slot, and
  // this 3:1 fixture derives contain — which has no pan to smoke. Force the
  // explicit cover override through the real pill, then dismiss the chrome
  // so the desktop drag still asserts "no selection chrome".
  const setupCenter = await evalJs(`(() => {
    const r = document.querySelector('[data-testid=hero-slot] img').getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })()`)
  const tap = async (x, y) => {
    await mouseEvent(app, 'mousePressed', x, y)
    await mouseEvent(app, 'mouseReleased', x, y)
  }
  await tap(setupCenter.x, setupCenter.y)
  await waitUntil('setup pill', async () =>
    evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`),
  )
  await evalJs(
    `[...document.querySelectorAll('[data-testid=shot-pan-overlay] button')].find(b => b.textContent.includes('Đầy khung'))?.click()`,
  )
  await waitUntil('cover override', async () =>
    evalJs(`!!document.querySelector('[data-testid=hero-slot] img.object-cover')`),
  )
  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Xong'))?.click()`,
  )
  await waitUntil(
    'setup chrome gone',
    async () => !(await evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`)),
  )

  const heroImg = `document.querySelector('[data-testid=hero-slot] img.object-cover')`
  const position = () => evalJs(`${heroImg}?.style.objectPosition ?? null`)
  const claimsTouch = () => evalJs(`getComputedStyle(${heroImg}).touchAction === 'none'`)
  const centerOf = async () =>
    evalJs(`(() => {
    const r = ${heroImg}.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })()`)

  // --- 1. desktop: drag pans immediately, no selection chrome ---------------
  if (!(await evalJs(`matchMedia('(hover: hover)').matches`)))
    throw new Error('expected hover-capable desktop')
  // Drag semantics: moves carry the pressed-button bitmask.
  const mouse = (type, x, y) =>
    mouseEvent(app, type, x, y, { buttons: type === 'mouseMoved' ? 1 : 0 })
  const touchPoint = (type, x, y) => touchEvent(app, type, [{ x, y }])
  let pos = await position()
  let c = await centerOf()
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
  if (await claimsTouch()) throw new Error('unarmed shot must not claim touch-action')
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
  if (!(await claimsTouch())) throw new Error('armed shot must claim touch-action')
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
  // [Đặt lại] clears the WHOLE adjustment set — fit override included — so
  // this 3:1 fixture re-derives contain (ADR 0006 §1). Assert the reset
  // through the sharp img: contained render, no zoom transform left.
  const resetState = await evalJs(`(() => {
    const sharp = document.querySelector('[data-testid=hero-slot] img.object-contain')
    return { contain: !!sharp, blur: !!document.querySelector('[data-testid=hero-slot] img.blur-2xl'), transform: sharp?.style.transform ?? null }
  })()`)
  if (!resetState.contain || !resetState.blur || resetState.transform)
    throw new Error(`[Đặt lại] did not clear the adjustment set: ${JSON.stringify(resetState)}`)
  console.log('5. [Đặt lại] clears the whole adjustment set (re-derives contain) ✓')

  await evalJs(
    `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Xong'))?.click()`,
  )
  await waitUntil(
    'overlay gone',
    async () => !(await evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`)),
  )
  if (await claimsTouch()) throw new Error('disarmed shot must release touch-action')
  console.log('6. [Xong] disarms and releases touch-action ✓')

  writeFileSync(
    '/tmp/pan-smoke-final.png',
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
  )
  console.log('SMOKE OK: hybrid pointer model verified end to end')
})
