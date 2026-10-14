// Export smoke for issue #34 (ADR 0005): drive the real app in headless
// Chrome — switch to Showcase, ingest two screenshots through the real file
// input, Fit the hero, screenshot the preview, export through the real
// Copy button path, and pull the exported PNG back out.
// Verifies decision 3 on real pixels: the CSS blur backdrop survives
// html-to-image. The sharp cover copy behind a dead blur would leave the
// margin strip at ~3 distinct stripe colors; a live blur mixes them into
// dozens of intermediate hues.
import { writeFileSync } from 'node:fs'
import { startSmokeApp, sleep } from './lib/smoke-app.mjs'

let app
try {
  app = await startSmokeApp()
  const { send, evalJs, waitUntil } = app

  // --- 1. Showcase mode ----------------------------------------------------
  await evalJs(
    `[...document.querySelectorAll('[role=radio]')].find(r => r.textContent.includes('Giới thiệu'))?.click()`,
  )
  await waitUntil('showcase section', () =>
    evalJs(
      `[...document.querySelectorAll('label')].some(l => l.textContent.includes('Ảnh chụp màn hình'))`,
    ),
  )

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

  // --- 6. decision 3 on real pixels: the blur backdrop survived the export --
  const colorBuckets = await evalJs(`(async () => {
    const img = new Image()
    img.src = ${JSON.stringify(dataUrl)}
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0)
    // The Fit window card leaves a margin of backdrop around it; sample the
    // left strip just inside the slot edge — x < ~3.5% is the card's flat
    // page padding, which would undercount a perfectly healthy blur.
    const strip = g.getImageData(
      Math.round(c.width * 0.035),
      Math.round(c.height * 0.15),
      Math.max(2, Math.round(c.width * 0.025)),
      Math.round(c.height * 0.3),
    )
    const buckets = new Set()
    for (let i = 0; i < strip.data.length; i += 4) {
      if (strip.data[i + 3] < 128) continue
      buckets.add(
        (strip.data[i] >> 5) + ',' + (strip.data[i + 1] >> 5) + ',' + (strip.data[i + 2] >> 5),
      )
    }
    return buckets.size
  })()`)
  // The fixture's stripes have ~3 flat colors: a dropped blur leaves under 8
  // quantized buckets; a live blur blends them into dozens.
  if (colorBuckets < 12)
    throw new Error(
      `blur backdrop did not survive export — margin strip has only ${colorBuckets} color buckets`,
    )
  console.log('blur backdrop survived export ✓ (margin strip color buckets:', colorBuckets + ')')

  const bytes = (await import('node:fs')).statSync('/tmp/smoke-exported.png').size
  console.log('SMOKE OK: preview + exported PNG captured, exported bytes =', bytes)
} catch (err) {
  console.error('SMOKE FAIL:', err.message ?? err)
  process.exitCode = 1
} finally {
  app?.close()
}
