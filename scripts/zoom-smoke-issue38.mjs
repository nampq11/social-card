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
import { writeFileSync, statSync } from 'node:fs'
import { startSmokeApp, sleep } from './lib/smoke-app.mjs'

// Headless Chrome reports (hover: none) — stub it so the desktop phase
// behaves like a mouse machine and the touch phase can flip the capability
// off (same approach as the jsdom shim and pan-smoke).
const HOVER_STUB = `(() => {
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

let app
try {
  app = await startSmokeApp({ newDocumentScripts: [HOVER_STUB] })
  const { send, evalJs, waitUntil } = app
  await send('DOM.enable')

  // --- setup: showcase mode, tour dismissed --------------------------------
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

  const pickShot = async (file) => {
    await send('DOM.getDocument')
    const obj = await send('Runtime.evaluate', {
      expression: `document.querySelector('input[type=file]')`,
      returnByValue: false,
    })
    const { nodeId } = await send('DOM.requestNode', { objectId: obj.result.objectId })
    await send('DOM.setFileInputFiles', { nodeId, files: [file] })
  }

  // --- 1. auto-fit: matched ratio → cover; ~2.2× wider → contain + blur ----
  await pickShot('/tmp/zoom-hero.png')
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
  await pickShot('/tmp/zoom-wide.png')
  await sleep(1500)
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

  // --- 2. baseline export: transition count across the hero ----------------
  const exportCard = async () =>
    evalJs(`(async () => {
      const captured = []
      const originalClick = HTMLAnchorElement.prototype.click
      HTMLAnchorElement.prototype.click = function () { captured.push(this.href) }
      try {
        const exportModule = await import(new URL('src/lib/export.ts', document.baseURI).href)
        await exportModule.downloadCardImage(document.querySelector('#social-card-node'), 'smoke.png')
      } finally { HTMLAnchorElement.prototype.click = originalClick }
      return captured[0] ?? null
    })()`)

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

  const baseline = await exportCard()
  if (!baseline) throw new Error('baseline export produced no PNG')
  writeFileSync('/tmp/zoom-baseline.png', Buffer.from(baseline.split(',')[1], 'base64'))
  const baselineTransitions = await countTransitions(baseline)
  if (baselineTransitions < 6)
    throw new Error(`baseline scanline should cross ≥6 bar edges, got ${baselineTransitions}`)
  console.log('2. unzoomed export scanline transitions:', baselineTransitions, '✓')

  // --- 3. force cover via the pill (the wide sibling changed the hero's
  //      derived default; the explicit override must win) -------------------
  const heroCenter = await evalJs(`(() => {
    const r = document.querySelector('[data-testid=hero-slot]').getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })()`)
  const mouse = (type, x, y) =>
    send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: 'left',
      buttons: 0,
      pointerType: 'mouse',
    })
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

  // --- 4. touch: tap-to-select arms the shot, two-finger pinch zooms -------
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await evalJs(`window.__setHover(false)`)
  await sleep(400)
  const touch = (type, points) =>
    send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id ?? 1 })),
    })
  // Arming tap (touch needs the explicit selection step).
  await touch('touchStart', [{ x: heroCenter.x, y: heroCenter.y }])
  await touch('touchEnd', [])
  await waitUntil('selection pill again', () =>
    evalJs(`!!document.querySelector('[data-testid=shot-pan-overlay]')`),
  )
  // Pinch out 40 → 90 px half-span: 2.25× anchored at the midpoint.
  const pinchAt = (span, phase) =>
    touch(phase, [
      { x: heroCenter.x - span, y: heroCenter.y, id: 1 },
      { x: heroCenter.x + span, y: heroCenter.y, id: 2 },
    ])
  await pinchAt(40, 'touchStart')
  for (let s = 50; s <= 90; s += 10) await pinchAt(s, 'touchMove')
  await touch('touchEnd', [])
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
    send('Input.dispatchMouseEvent', {
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
  const zoomed = await exportCard()
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
  writeFileSync('/tmp/zoom-exported.png', Buffer.from(zoomed.split(',')[1], 'base64'))

  const bytes = statSync('/tmp/zoom-exported.png').size
  console.log(
    'SMOKE OK: auto-fit + pill override + pinch/wheel zoom + zoomed export, exported bytes =',
    bytes,
  )
} catch (err) {
  console.error('SMOKE FAIL:', err.message ?? err)
  process.exitCode = 1
} finally {
  app?.close()
}
