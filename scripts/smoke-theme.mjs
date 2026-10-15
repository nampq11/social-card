// Theme smoke (issue #45): drive the real app in headless Chrome and flip
// prefers-color-scheme via CDP media emulation. Verifies two contracts on
// computed styles:
//   1. App chrome follows the OS: the glass header and the canvas backdrop
//      restyle in dark mode (the .dark-class CSS blocks were dead code —
//      nothing ever applied the class — so glass/canvas stayed light while
//      dark: utilities flipped, a light-on-light contrast bug).
//   2. The card canvas is static: #social-card-node renders the theme's own
//      colors regardless of OS mode, so exports never depend on the viewer
//      (the invariant the design-token work builds on).
import { runSmoke } from './lib/smoke-app.mjs'

// getComputedStyle color strings are deterministic in Chrome; exact matches
// keep the assertions readable and immune to formatting drift.
const LIGHT = {
  canvas: 'rgb(242, 242, 247)',
  glass: 'rgba(255, 255, 255, 0.85)',
  card: 'rgb(250, 249, 245)', // 'paper' theme bg (#FAF9F5) — the factory default
  ink: 'rgb(29, 29, 31)',
}
const DARK = {
  canvas: 'rgb(11, 11, 12)',
  glass: 'rgba(26, 26, 30, 0.85)',
  ink: 'rgb(245, 245, 247)',
}

const readTheme = (app) =>
  app.evalJs(`(() => {
    const style = (el) => el ? getComputedStyle(el).backgroundColor : null
    return {
      canvas: style(document.querySelector('.apple-canvas-bg')),
      glass: style(document.querySelector('header.apple-glass')),
      card: style(document.querySelector('#social-card-node')),
      ink: getComputedStyle(document.querySelector('.apple-canvas-bg')).color,
    }
  })()`)

const scheme = (app, value) =>
  app.send('Emulation.setEmulatedMedia', {
    features: value ? [{ name: 'prefers-color-scheme', value }] : [],
  })

// The app root animates color flips (transition-colors duration-200), so
// scheme changes must be awaited on settled computed styles, not read once.
const expectColorsSettled = async (app, label, expected) => {
  await app.waitUntil(label, async () => {
    const actual = await readTheme(app)
    return Object.entries(expected).every(([key, value]) => actual[key] === value)
  })
}

await runSmoke({}, async (app) => {
  // --- 1. light baseline (headless Chrome defaults to light) ---------------
  await expectColorsSettled(app, 'light baseline', LIGHT)

  // --- 2. dark: chrome flips, card must not ---------------------------------
  await scheme(app, 'dark')
  await expectColorsSettled(app, 'dark chrome', {
    canvas: DARK.canvas,
    glass: DARK.glass,
    ink: DARK.ink,
    card: LIGHT.card, // the export invariant: theme colors ignore OS mode
  })

  // --- 3. back to light: everything restores --------------------------------
  await scheme(app, null)
  await expectColorsSettled(app, 'restored light', LIGHT)

  console.log('SMOKE OK: chrome follows OS scheme, card stays theme-static ✓')
})
