// Zoom smoke for issue #38 T5 (ADR 0006): drive the real app in headless
// Chrome and verify the new behaviors on real pixels/DOM:
//   1. auto-fit — a shot matching the hero slot's real rendered ratio keeps
//      cover; a ~2.2× wider shot in the detail band derives contain + blur;
//   2. gestures — a real two-finger CDP pinch zooms the armed Shot, and
//      ctrl+wheel zooms further while plain wheel stays inert;
//   3. export — the zoom survives html-to-image, measured as magnification:
//      a striped fixture sampled across the hero shows ~3× fewer luminance
//      transitions after a ≥3× zoom (a dropped transform shows the same
//      count; cropping only shifts phase, not the count).
import { writeFileSync } from 'node:fs'
import {
  HOVER_STUB,
  clearShots,
  exportCard,
  mouseEvent,
  openShowcase,
  pickShot,
  runSmoke,
  sleep,
  touchEvent,
} from './lib/smoke-app.mjs'

await runSmoke({ newDocumentScripts: [HOVER_STUB] }, async (app) => {
  const { evalJs, waitUntil } = app

  // --- setup: showcase mode, collage emptied for ratio-controlled fixtures --
  await openShowcase(app)
  await clearShots(app)

  // Slots size by flex, not a fixed ratio — measure the hero placeholder's
  // real rendered ratio and build fixtures from it: one matched (log-ratio 0
  // → cover) and one ~3.3× wider. With two shots the detail band runs ~1.5×
  // the hero ratio, so 3.3× lands far outside the ±20% log-ratio auto band
  // no matter the exact layout.
  const heroRatio = await evalJs(`(() => {
    const r = document.querySelector('[data-testid=hero-slot]').getBoundingClientRect()
    return r.width / r.height
  })()`)
  const fixtures = await evalJs(`(async (ratio) => {
    const make = (w, h, draw) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      draw(c.getContext('2d'))
      const a = document.createElement('a'); a.href = c.toDataURL('image/png')
      return a.href
    }
    // Vertical black/white bars, 40px period. No other features: the
    // transitions scanline samples one mid-slot row, so anything else on it
    // would flatten the count.
    const bars = (g, w, h) => {
      for (let x = 0; x < w; x += 40) {
        g.fillStyle = (x / 40) % 2 ? '#111111' : '#f5f5f5'
        g.fillRect(x, 0, 40, h)
      }
    }
    const matchedH = Math.round(800 / ratio)
    const wideH = Math.round(800 / (ratio * 3.3))
    return {
      matched: make(800, matchedH, (g) => bars(g, 800, matchedH)),
      wide: make(800, wideH, (g) => bars(g, 800, wideH)),
    }
  })(${heroRatio})`)
  writeFileSync('/tmp/zoom-hero.png', Buffer.from(fixtures.matched.split(',')[1], 'base64'))
  writeFileSync('/tmp/zoom-wide.png', Buffer.from(fixtures.wide.split(',')[1], 'base64'))

  const mouse = (type, x, y, clickCount = 1) => mouseEvent(app, type, x, y, { clickCount })

  // --- 1. auto-fit: matched ratio → cover; ~2.2× wider → contain + blur ----
  await pickShot(app, '/tmp/zoom-hero.png')
  await waitUntil('hero shot', () =>
    evalJs(`!!document.querySelector('[data-testid=hero-slot] img')`),
  )
  const heroIsCover = await evalJs(
    `(() => {
      const slot = document.querySelector('[data-testid=hero-slot]')
      return {
        count: slot.querySelectorAll('img').length,
        cover: !!slot.querySelector('img.object-cover'),
        blur: !!slot.querySelector('img.blur-2xl'),
      }
    })()`,
  )
  if (heroIsCover.count !== 1 || !heroIsCover.cover || heroIsCover.blur)
    throw new Error(
      `ratio-matched hero must render cover alone, got ${JSON.stringify(heroIsCover)}`,
    )
  console.log('1a. hero shot matching the slot ratio keeps cover ✓')

  // --- 1c. desktop click (no drag) on a COVER shot surfaces the pill -------
  // A hover-capable press that stays within the click slop falls through to
  // the tap branch, so select stays reachable on desktop cover shots
  // (contain shots and touch select through this branch too — this step
  // pins the cover case).
  const heroCenter = await evalJs(`(() => {
    const r = document.querySelector('[data-testid=hero-slot]').getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })()`)
  await mouse('mousePressed', heroCenter.x, heroCenter.y)
  await mouse('mouseReleased', heroCenter.x, heroCenter.y)
  await waitUntil('selection pill on a cover shot', () =>
    evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`),
  )
  console.log('1c. desktop click selects the ratio-matched cover shot (pill) ✓')

  await pickShot(app, '/tmp/zoom-wide.png')
  await waitUntil('wide shot in detail band', () =>
    evalJs(`!!document.querySelector('[data-testid=detail-slot] img.object-contain')`),
  )
  const detailAuto = await evalJs(
    `(() => {
      const slot = document.querySelector('[data-testid=detail-slot]')
      return { contain: !!slot.querySelector('img.object-contain'), blur: !!slot.querySelector('img.blur-2xl') }
    })()`,
  )
  if (!detailAuto.contain || !detailAuto.blur)
    throw new Error(
      `wide shot must derive contain + blur backdrop, got ${JSON.stringify(detailAuto)}`,
    )
  console.log('1b. ~3.3× wider shot auto-fits contain with blur backdrop ✓')

  // One scanline through the hero slot's vertical middle, middle 40% of the
  // width — inside the sharp copy even when a contain render letterboxes it.
  // Count luminance crossings: the bar period shrinks 1:1 with the zoom.
  const countTransitions = (dataUrl) =>
    evalJs(`(async () => {
      const img = new Image()
      img.src = ${JSON.stringify(dataUrl)}
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0)
      const node = document.querySelector('#social-card-node').getBoundingClientRect()
      const slot = document.querySelector('[data-testid=hero-slot]').getBoundingClientRect()
      const k = img.width / node.width
      const y = Math.round((slot.y - node.y + slot.height * 0.5) * k)
      const x0 = Math.round((slot.x - node.x + slot.width * 0.3) * k)
      const x1 = Math.round((slot.x - node.x + slot.width * 0.7) * k)
      const row = g.getImageData(x0, y, x1 - x0, 1).data
      let count = 0
      let prev = null
      for (let i = 0; i < row.length; i += 4) {
        const lum = 0.299 * row[i] + 0.587 * row[i + 1] + 0.114 * row[i + 2]
        const level = lum > 128
        if (prev !== null && level !== prev) count++
        prev = level
      }
      return count
    })()`)

  const baseline = await exportCard(app)
  if (!baseline) throw new Error('baseline export produced no PNG')
  writeFileSync('/tmp/zoom-baseline.png', Buffer.from(baseline.split(',')[1], 'base64'))
  const baselineTransitions = await countTransitions(baseline)
  if (baselineTransitions < 6)
    throw new Error(`baseline scanline should cross ≥6 bar edges, got ${baselineTransitions}`)
  console.log('2. unzoomed export scanline transitions:', baselineTransitions, '✓')

  // --- 3. force cover via the pill (the wide sibling changed the hero's
  //      derived default; the explicit override must win) -------------------
  await mouse('mousePressed', heroCenter.x, heroCenter.y)
  await mouse('mouseReleased', heroCenter.x, heroCenter.y)
  await waitUntil('selection pill', () =>
    evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`),
  )
  await evalJs(
    `[...document.querySelectorAll('[data-testid=shot-pan-overlay] button')].find(b => b.textContent.includes('Đầy khung'))?.click()`,
  )
  await sleep(200)
  const heroCoverOverride = await evalJs(
    `(() => {
      const slot = document.querySelector('[data-testid=hero-slot]')
      return { cover: !!slot.querySelector('img.object-cover'), blur: !!slot.querySelector('img.blur-2xl') }
    })()`,
  )
  if (!heroCoverOverride.cover || heroCoverOverride.blur)
    throw new Error(`explicit cover override did not win, got ${JSON.stringify(heroCoverOverride)}`)
  console.log('3. pill fit toggle forces cover over the derived default ✓')

  // --- 3b. double-click zoom toggles 1 ↔ 2 on the now-cover hero (§4) ------
  // Two CDP click pairs inside the 350ms window.
  const dblclick = async () => {
    for (const clickCount of [1, 2]) {
      await mouse('mousePressed', heroCenter.x, heroCenter.y, clickCount)
      await mouse('mouseReleased', heroCenter.x, heroCenter.y, clickCount)
    }
  }
  await dblclick()
  await sleep(200)
  const zoomedIn = await evalJs(
    `document.querySelector('[data-testid=hero-slot] img.object-cover').style.transform`,
  )
  if (zoomedIn !== 'scale(2)')
    throw new Error(
      `double-click should zoom the cover hero to scale(2), got ${JSON.stringify(zoomedIn)}`,
    )
  console.log('3b. double-click zooms the cover hero to scale(2) ✓')
  await dblclick()
  await sleep(200)
  const zoomedOut = await evalJs(
    `document.querySelector('[data-testid=hero-slot] img.object-cover').style.transform`,
  )
  if (zoomedOut)
    throw new Error(`second double-click should restore scale 1, got ${JSON.stringify(zoomedOut)}`)
  console.log('3c. second double-click restores scale 1 ✓')

  // --- 4. touch: tap-to-select arms the shot, two-finger pinch zooms -------
  await app.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await evalJs(`window.__setHover(false)`)
  await sleep(400)
  // Arming tap (touch needs the explicit selection step).
  await touchEvent(app, 'touchStart', [{ x: heroCenter.x, y: heroCenter.y }])
  await touchEvent(app, 'touchEnd', [])
  await waitUntil('selection pill again', () =>
    evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`),
  )
  // Pinch out 40 → 90 px half-span: 2.25× anchored at the midpoint.
  const pinchAt = (span, phase) =>
    touchEvent(app, phase, [
      { x: heroCenter.x - span, y: heroCenter.y, id: 1 },
      { x: heroCenter.x + span, y: heroCenter.y, id: 2 },
    ])
  await pinchAt(40, 'touchStart')
  for (let s = 50; s <= 90; s += 10) await pinchAt(s, 'touchMove')
  await touchEvent(app, 'touchEnd', [])
  await sleep(300)
  const scaleOf = () =>
    evalJs(
      `parseFloat(document.querySelector('[data-testid=hero-slot] img').style.transform.match(/scale\\(([\\d.]+)\\)/)?.[1] ?? 0)`,
    )
  const scaleAfterPinch = await scaleOf()
  if (!(scaleAfterPinch >= 1.8)) throw new Error(`pinch did not zoom (scale=${scaleAfterPinch})`)
  console.log('4. two-finger pinch zoomed the armed shot ✓ (scale =', scaleAfterPinch + ')')

  // --- 5. ctrl+wheel zooms further; plain wheel must not -------------------
  await evalJs(`window.__setHover(true)`)
  await sleep(300)
  // CDP encodes ctrl through the modifier bitmask (Ctrl = 2), not a
  // ctrlKey param — an unknown key is silently dropped and the event lands
  // without the modifier.
  const wheel = (deltaY, ctrl) =>
    app.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: heroCenter.x,
      y: heroCenter.y,
      deltaX: 0,
      deltaY,
      modifiers: ctrl ? 2 : 0,
      pointerType: 'mouse',
    })
  await wheel(-120, false)
  await sleep(150)
  const afterPlainWheel = await scaleOf()
  if (afterPlainWheel !== scaleAfterPinch)
    throw new Error(`plain wheel must not zoom (scale ${scaleAfterPinch} → ${afterPlainWheel})`)
  await wheel(-240, true)
  await sleep(150)
  const afterCtrlWheel = await scaleOf()
  if (!(afterCtrlWheel > scaleAfterPinch * 1.4))
    throw new Error(`ctrl+wheel did not zoom further (${scaleAfterPinch} → ${afterCtrlWheel})`)
  console.log('5. plain wheel inert, ctrl+wheel zoomed ✓ (scale =', afterCtrlWheel + ')')

  // --- 6. the zoom survives export: bar period shrinks with the zoom -------
  const zoomed = await exportCard(app)
  if (!zoomed) throw new Error('zoomed export produced no PNG')
  const zoomedTransitions = await countTransitions(zoomed)
  if (!(zoomedTransitions < baselineTransitions / 2))
    throw new Error(
      `zoomed export scanline should show under half the transitions (${baselineTransitions} → ${zoomedTransitions}) — transform did not survive export`,
    )
  console.log(
    '6. zoomed export magnification verified:',
    baselineTransitions,
    '→',
    zoomedTransitions,
    'transitions ✓',
  )
  const zoomedPng = Buffer.from(zoomed.split(',')[1], 'base64')
  writeFileSync('/tmp/zoom-exported.png', zoomedPng)

  console.log(
    'SMOKE OK: auto-fit + pill override + pinch/wheel zoom + zoomed export, exported bytes =',
    zoomedPng.length,
  )
})
