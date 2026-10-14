import type { ShotFit, ShotFocus } from '../types'

// Absent focus renders exactly like the original object-cover object-top:
// horizontally centered, top-anchored (ADR 0005).
export const DEFAULT_SHOT_FOCUS: ShotFocus = { x: 0.5, y: 0 }

// Sanitize one focus axis: non-finite values collapse to neutral, anything
// outside 0..1 clamps to the edge. Focus is the normalized 0..1 anchor of
// which part of a Shot shows when it crops (GLOSSARY.md "Focus").
const sanitizeAxis = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5

// Cover pans, so any focus in 0..1 is valid. Fit (contain) shows the whole
// Shot — pan is meaningless and focus is forced centered. The renderer never
// overshoots the image edge by construction: it translates by
// (1 - visibleFraction) * focus, so clamping to 0..1 is the whole contract.
export const clampFocus = (focus: ShotFocus, fit: ShotFit): ShotFocus =>
  fit === 'contain' ? { x: 0.5, y: 0.5 } : { x: sanitizeAxis(focus.x), y: sanitizeAxis(focus.y) }

// The renderer's focus→CSS mapping (ADR 0005, amended): object-position
// reproduces focus natively and ratio-free — 0..1 to 0%..100% — instead of
// an explicit transform (which bought nothing while zoom is deferred, and
// would have required natural-size and slot-size measurement). Fit (contain)
// centers: the whole Shot shows, the anchor is irrelevant. Clamped on read
// so no write path can smuggle an out-of-range position into the DOM.
export const shotAnchorCss = (focus: ShotFocus, fit: ShotFit): string => {
  const clamped = clampFocus(focus, fit)
  return `${clamped.x * 100}% ${clamped.y * 100}%`
}

// One pan gesture's math (ADR 0005): pointer deltas in slot pixels become a
// clamped focus, against the cover overflow of each axis. Dragging the image
// right (dx > 0) brings the left edge into view, so focus moves AGAINST the
// pointer. An axis without overflow is inert — nothing to pan there — which
// also makes zero-size measurements (jsdom, pre-layout) a safe no-op.
export const focusFromDrag = (
  focus: ShotFocus,
  dxPx: number,
  dyPx: number,
  slotWidth: number,
  slotHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  fit: ShotFit = 'cover',
): ShotFocus => {
  const start = clampFocus(focus, fit)
  if (fit === 'contain') return start
  const scale = Math.max(slotWidth / naturalWidth, slotHeight / naturalHeight)
  const overflowX = naturalWidth * scale - slotWidth
  const overflowY = naturalHeight * scale - slotHeight
  const axis = (value: number, delta: number, overflow: number) =>
    overflow > 0 ? Math.min(1, Math.max(0, value - delta / overflow)) : value
  return {
    x: axis(start.x, dxPx, overflowX),
    y: axis(start.y, dyPx, overflowY),
  }
}
