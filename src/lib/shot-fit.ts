import type { Shot, ShotFit, ShotFocus } from '../types'

// Absent focus renders exactly like the original object-cover object-top:
// horizontally centered, top-anchored (ADR 0005).
export const DEFAULT_SHOT_FOCUS: ShotFocus = { x: 0.5, y: 0 }

// A Shot's effective Fit (GLOSSARY.md "Fit"): the absent field is cover,
// reproducing the original object-cover render (ADR 0005). One accessor so
// the defaulting rule has a single home instead of one per read site.
export const shotFit = (shot: Shot): ShotFit => shot.fit ?? 'cover'

// Zoom ceiling for a Shot's Scale (GLOSSARY.md "Scale", ADR 0006 §4): deep
// enough to isolate a detail on a dense screenshot, shallow enough that the
// pixelated source stays honest about being a screenshot.
export const SHOT_SCALE_MAX = 4

// Sanitize one focus axis: non-finite values collapse to neutral, anything
// outside 0..1 clamps to the edge. Focus is the normalized 0..1 anchor of
// which part of a Shot shows when it crops (GLOSSARY.md "Focus").
const sanitizeAxis = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5

// Clamp one Scale value into the 1..MAX domain; non-finite collapses to 1
// (the unzoomed render). Mirrors sanitizeAxis for the zoom axis.
export const clampScale = (scale: number): number =>
  Number.isFinite(scale) ? Math.min(SHOT_SCALE_MAX, Math.max(1, scale)) : 1

// The default Fit when the user has not overridden one (ADR 0006 §1): derived
// from the shot-to-slot ratio — near matches (within ~20%, compared as a log
// ratio so wide and tall mismatch symmetrically) keep cover; anything else
// contains, because a screenshot silently cropped by default is the exact
// complaint this replaces. Degenerate measurements (pre-layout, jsdom) keep
// cover — the historical render — until real numbers arrive.
export const autoFitForSlot = (
  naturalWidth: number,
  naturalHeight: number,
  slotWidth: number,
  slotHeight: number,
): ShotFit => {
  if (naturalWidth <= 0 || naturalHeight <= 0 || slotWidth <= 0 || slotHeight <= 0) return 'cover'
  const shotRatio = naturalWidth / naturalHeight
  const slotRatio = slotWidth / slotHeight
  return Math.abs(Math.log(shotRatio / slotRatio)) <= Math.log(1.2) ? 'cover' : 'contain'
}

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
  zoom = 1,
): ShotFocus => {
  const start = clampFocus(focus, fit)
  if (fit === 'contain') return start
  const coverScale = Math.max(slotWidth / naturalWidth, slotHeight / naturalHeight)
  // Zoom (ADR 0006 §4) multiplies the cover-rendered content, so overflow
  // grows with it and pan stays 1:1 at every level; past 1 even the
  // previously exact-fit axis gains overflow.
  const zoomScale = coverScale * clampScale(zoom)
  const overflowX = naturalWidth * zoomScale - slotWidth
  const overflowY = naturalHeight * zoomScale - slotHeight
  const axis = (value: number, delta: number, overflow: number) =>
    overflow > 0 ? Math.min(1, Math.max(0, value - delta / overflow)) : value
  return {
    x: axis(start.x, dxPx, overflowX),
    y: axis(start.y, dyPx, overflowY),
  }
}

// Rubber-banding (ADR 0006 §3, WWDC18 803): an overdrag past an edge follows
// the pointer with progressive resistance — the further past, the smaller the
// fraction — instead of the "frozen wall" of a hard stop. Apple's form:
// (x·dim·c) / (dim + c·|x|).
export const rubberbandDelta = (overshootPx: number, dimensionPx: number, constant = 0.55) =>
  (overshootPx * dimensionPx * constant) / (dimensionPx + constant * Math.abs(overshootPx))

// Momentum projection (ADR 0006 §3): a release velocity coasts a projected
// distance (Apple's exponential-decay form, r = 0.998 — px coast ≈ 0.499·v),
// and the nearest valid end wins. Same sign convention as focusFromDrag:
// focus moves against pointer px. Inert without overflow.
export const projectedFocus = (value: number, velocityPxPerS: number, overflowPx: number) => {
  if (overflowPx <= 0) return sanitizeAxis(value)
  const coastPx = (velocityPxPerS / 1000) * (0.998 / (1 - 0.998))
  return Math.min(1, Math.max(0, value - coastPx / overflowPx))
}

// Pinch anchoring (ADR 0006 §4): zooming keeps the content point under the
// pinch midpoint stationary. object-position percentages align the content's
// anchor fraction with the box's, so the content fraction under box fraction
// p is c = x + (p − x)·k where k = box/content; solving for the anchor after
// the scale change gives x' = (c − p'·k')/(1 − k'). An axis with k' ≥ 1 has
// no overflow — the anchor is meaningless and keeps its old value.
export const focusForPinch = (
  focus: ShotFocus,
  zoomFrom: number,
  zoomTo: number,
  midpointFrom: ShotFocus,
  midpointTo: ShotFocus,
  slotWidth: number,
  slotHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): ShotFocus => {
  const start = clampFocus(focus, 'cover')
  const coverScale = Math.max(slotWidth / naturalWidth, slotHeight / naturalHeight)
  const axisAnchor = (value: number, p0: number, p1: number, slotPx: number, naturalPx: number) => {
    const kFrom = slotPx / (naturalPx * coverScale * clampScale(zoomFrom))
    const kTo = slotPx / (naturalPx * coverScale * clampScale(zoomTo))
    if (kTo >= 1) return value
    const contentFraction = value + (p0 - value) * kFrom
    return Math.min(1, Math.max(0, (contentFraction - p1 * kTo) / (1 - kTo)))
  }
  return {
    x: axisAnchor(start.x, midpointFrom.x, midpointTo.x, slotWidth, naturalWidth),
    y: axisAnchor(start.y, midpointFrom.y, midpointTo.y, slotHeight, naturalHeight),
  }
}
