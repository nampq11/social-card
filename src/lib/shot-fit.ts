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

// The measurements one gesture's math needs: the slot's layout box and the
// image's intrinsic size, in CSS px. offsetWidth/naturalWidth on purpose —
// neither moves under the preview's CSS transform, so every px here is a
// slot-layout px and pointer input converts once, at the boundary.
export interface ShotGeometry {
  slotWidth: number
  slotHeight: number
  naturalWidth: number
  naturalHeight: number
}

export const coverScaleOf = (geometry: ShotGeometry) =>
  Math.max(geometry.slotWidth / geometry.naturalWidth, geometry.slotHeight / geometry.naturalHeight)

// Cover render overflow per axis in slot layout px (ADR 0006 §4): the zoomed
// cover render minus the slot — a pan's whole travel domain. An axis at or
// below zero is inert (nothing to pan), which also makes zero-size
// measurements (jsdom, pre-layout) safe no-ops.
export const coverOverflowOf = (geometry: ShotGeometry, scale: number) => {
  const renderScale = coverScaleOf(geometry) * clampScale(scale)
  return {
    x: geometry.naturalWidth * renderScale - geometry.slotWidth,
    y: geometry.naturalHeight * renderScale - geometry.slotHeight,
  }
}

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

// One pan gesture's math (ADR 0006 §3): pointer deltas in slot layout px
// become a clamped focus against the zoomed cover overflow, with travel past
// an edge rubber-banded instead of hard-stopped. Dragging the image right
// (dx > 0) brings the left edge into view, so focus moves AGAINST the
// pointer. Cover only — a contain Shot shows whole and never arms a drag.
export interface DragOutcome {
  focus: ShotFocus
  // Transient rubber-band excess per axis in px — a translate on the image,
  // never stored focus (the store's domain stays 0..1, ADR 0005's contract).
  overdrag: ShotFocus
}

export const focusFromDrag = (
  start: ShotFocus,
  dxPx: number,
  dyPx: number,
  geometry: ShotGeometry,
  scale = 1,
  rubberbandConstant = 0.55,
): DragOutcome => {
  const overflow = coverOverflowOf(geometry, scale)
  const axis = (value: number, delta: number, over: number, dimension: number) => {
    // `!(over > 0)` on purpose: a degenerate measurement yields NaN overflow,
    // and every NaN comparison is false — the guard must still fire.
    if (!(over > 0)) return { value, excess: 0 }
    const raw = value * over - delta
    if (raw < 0) return { value: 0, excess: rubberbandDelta(-raw, dimension, rubberbandConstant) }
    if (raw > over)
      return { value: 1, excess: -rubberbandDelta(raw - over, dimension, rubberbandConstant) }
    return { value: raw / over, excess: 0 }
  }
  const x = axis(start.x, dxPx, overflow.x, geometry.slotWidth)
  const y = axis(start.y, dyPx, overflow.y, geometry.slotHeight)
  return { focus: { x: x.value, y: y.value }, overdrag: { x: x.excess, y: y.excess } }
}

// Rubber-banding (ADR 0006 §3, WWDC18 803): an overdrag past an edge follows
// the pointer with progressive resistance — the further past, the smaller the
// fraction — instead of the "frozen wall" of a hard stop. Apple's form:
// (x·dim·c) / (dim + c·|x|).
export const rubberbandDelta = (overshootPx: number, dimensionPx: number, constant = 0.55) =>
  (overshootPx * dimensionPx * constant) / (dimensionPx + constant * Math.abs(overshootPx))

export interface MomentumOutcome {
  focus: ShotFocus
  // The release velocity in focus units per second, for the settle spring's
  // handoff — zero on an inert axis (nowhere to coast).
  velocity: ShotFocus
}

export const momentumFocus = (
  from: ShotFocus,
  velocityXScreen: number,
  velocityYScreen: number,
  previewScale: number,
  geometry: ShotGeometry,
  scale: number,
): MomentumOutcome => {
  const overflow = coverOverflowOf(geometry, scale)
  // Pointer velocity is tracked in screen px/s while the overflow domain is
  // slot layout px — convert like the drag deltas do, or a CSS-scaled
  // preview coasts the wrong distance (or finds negative overflow and
  // coasts not at all).
  const toLayout = previewScale > 0 ? 1 / previewScale : 1
  const velocityX = velocityXScreen * toLayout
  const velocityY = velocityYScreen * toLayout
  const focus = {
    x: projectedFocus(from.x, velocityX, overflow.x),
    y: projectedFocus(from.y, velocityY, overflow.y),
  }
  // Handoff velocity for the settle spring, in focus units per second.
  // Focus moves AGAINST the pointer, so the coast runs at -v/overflow. When
  // the projection clamped at an edge, the wall absorbed the momentum —
  // seeding it would fling the Shot off the clamped target.
  const axisSeed = (fromValue: number, targetValue: number, vLayout: number, over: number) => {
    if (!(over > 0)) return 0
    if (Math.abs(targetValue - fromValue) < Math.abs(coastPx(vLayout)) / over - 1e-9) return 0
    return -vLayout / over
  }
  return {
    focus,
    velocity: {
      x: axisSeed(from.x, focus.x, velocityX, overflow.x),
      y: axisSeed(from.y, focus.y, velocityY, overflow.y),
    },
  }
}

// Apple's exponential-decay coast (r = 0.998): px traveled is ~0.499 times
// the release velocity, shared by the projection and the seed check.
const coastPx = (velocityPxPerS: number) => (velocityPxPerS / 1000) * (0.998 / (1 - 0.998))

// Momentum projection (ADR 0006 §3): a release velocity coasts a projected
// distance (Apple's exponential-decay form, r = 0.998 — px coast ≈ 0.499·v),
// and the nearest valid end wins. Same sign convention as focusFromDrag:
// focus moves against pointer px. Inert without overflow.
export const projectedFocus = (value: number, velocityPxPerS: number, overflowPx: number) => {
  // `!(overflowPx > 0)` fires for NaN too — degenerate measurements stay inert.
  if (!(overflowPx > 0)) return sanitizeAxis(value)
  return Math.min(1, Math.max(0, value - coastPx(velocityPxPerS) / overflowPx))
}

// One velocity sample of the pointer (ADR 0006 §3): instantaneous px/s,
// exponentially smoothed so a flick reads while jitter doesn't. The first
// sample (or a non-advancing clock) carries no velocity yet.
export interface VelocityState {
  velocityX: number
  velocityY: number
  x: number
  y: number
  at: number
}

export const trackVelocity = (
  prev: VelocityState | null,
  x: number,
  y: number,
  at: number,
): VelocityState => {
  if (!prev || at <= prev.at) return { velocityX: 0, velocityY: 0, x, y, at }
  const dtSeconds = (at - prev.at) / 1000
  const blend = 0.6
  return {
    velocityX: prev.velocityX * (1 - blend) + ((x - prev.x) / dtSeconds) * blend,
    velocityY: prev.velocityY * (1 - blend) + ((y - prev.y) / dtSeconds) * blend,
    x,
    y,
    at,
  }
}

// One frame of a critically damped spring (damping ratio 1.0 — no
// oscillation; ADR 0006 §3 settles on Apple's "response" scale, seconds).
// Exact closed-form integration of the continuous system, which buys two
// things a hand-rolled exponential approach does not: two half-length steps
// land exactly where one full step does (the rAF loop is safe under jank),
// and the carried velocity hands off from a flick without a kink.
export interface SpringState {
  value: number
  velocity: number
}

export const springStep = (
  state: SpringState,
  target: number,
  dtMs: number,
  response: number,
): SpringState => {
  if (dtMs <= 0) return state
  const dtS = dtMs / 1000
  // ω = 4/response (per second — dtS is seconds) keeps the old
  // τ = response/4 settle scale.
  const omega = 4 / response
  const offset = state.value - target
  const slope = state.velocity + omega * offset
  const decay = Math.exp(-omega * dtS)
  const settled = offset + slope * dtS
  return {
    value: target + settled * decay,
    velocity: (slope - omega * settled) * decay,
  }
}

// Pinch anchoring (ADR 0006 §4): zooming keeps the content point under the
// pinch midpoint stationary. object-position percentages align the content's
// anchor fraction with the box's, so the content fraction under box fraction
// p is c = x + (p − x)·k where k = box/content; solving for the anchor after
// the scale change gives x' = (c − p'·k')/(1 − k'). An axis with k' ≥ 1 has
// no overflow — the anchor is meaningless and keeps its old value.
export const focusForPinch = (
  focus: ShotFocus,
  scaleFrom: number,
  scaleTo: number,
  anchorFrom: ShotFocus,
  anchorTo: ShotFocus,
  geometry: ShotGeometry,
): ShotFocus => {
  const start = clampFocus(focus, 'cover')
  const coverScale = coverScaleOf(geometry)
  const axisAnchor = (value: number, p0: number, p1: number, slotPx: number, naturalPx: number) => {
    const kFrom = slotPx / (naturalPx * coverScale * clampScale(scaleFrom))
    const kTo = slotPx / (naturalPx * coverScale * clampScale(scaleTo))
    if (kTo >= 1) return value
    const contentFraction = value + (p0 - value) * kFrom
    return Math.min(1, Math.max(0, (contentFraction - p1 * kTo) / (1 - kTo)))
  }
  return {
    x: axisAnchor(start.x, anchorFrom.x, anchorTo.x, geometry.slotWidth, geometry.naturalWidth),
    y: axisAnchor(start.y, anchorFrom.y, anchorTo.y, geometry.slotHeight, geometry.naturalHeight),
  }
}
