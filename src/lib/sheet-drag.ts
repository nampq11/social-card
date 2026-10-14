// Bottom-sheet physics for the Mobile Shell (GLOSSARY.md / ADR 0002),
// following Apple's "Designing Fluid Interfaces" model: the sheet tracks
// the pointer 1:1, resists softly past its resting points, projects the
// release velocity to choose where it settles, and springs there carrying
// that velocity.

/** Fallback chrome height for environments that report no layout (jsdom):
 * the live peek is measured from the DOM in use-sheet-drag (top of the
 * scrollable content), so the resting sheet always ends exactly where the
 * content begins — nothing is ever half-clipped at rest. */
export const SHEET_MIN_CHROME_PX = 96

/** Sheet spring response (critically damped, no overshoot). */
export const SHEET_RESPONSE_S = 0.3

// Chrome above the canvas: just the floating header (≈68px + safe-area top,
// up to ≈47px on notched phones) plus a small margin. Undercounting lets the
// expanded sheet swallow the header; overcounting needlessly shrinks it.
const SHEET_CHROME_PX = 110
// Canvas floor: an expanded sheet still leaves this much card visible.
const SHEET_CANVAS_FLOOR_PX = 150
// Landscape phones have no headroom; the sheet still needs working room.
const MIN_EXPANSION_PX = 120

/**
 * Working height of the expanded sheet: 58dvh (ADR 0002), clamped so the
 * canvas keeps its floor of visible height — on phones without the headroom
 * (landscape), the minimum expansion wins and covers the canvas instead.
 */
export function sheetExpandedPx(viewportHeight: number): number {
  const target = Math.round(viewportHeight * 0.58)
  const headroom = viewportHeight - SHEET_CHROME_PX - SHEET_CANVAS_FLOOR_PX
  return Math.max(SHEET_MIN_CHROME_PX + MIN_EXPANSION_PX, Math.min(target, headroom))
}

/**
 * Soft boundary (Apple's rubber-band): the further past a resting point the
 * pointer pulls, the less of the overshoot the sheet follows.
 */
export function rubberbandDistance(
  overshootPx: number,
  dimensionPx: number,
  constant = 0.55,
): number {
  return (overshootPx * dimensionPx * constant) / (dimensionPx + constant * Math.abs(overshootPx))
}

/**
 * Where the sheet would rest if it decelerated like a scroll view:
 * exponential decay at `decelRate` per millisecond (0.998 ≈ UIScrollView).
 */
export function projectionDistance(velocityPxPerS: number, decelRate = 0.998): number {
  return ((velocityPxPerS / 1000) * decelRate) / (1 - decelRate)
}

/**
 * Chooses the resting point from the release: project the current offset
 * along the release velocity, then take whichever bound the projection
 * lands past. `offsetPx` is the pull-down distance (0 = expanded,
 * `maxOffsetPx` = peeked); velocity is positive downward.
 */
export function snapSheetTarget(
  offsetPx: number,
  velocityPxPerS: number,
  maxOffsetPx: number,
): number {
  const projected = offsetPx + projectionDistance(velocityPxPerS)
  return projected >= maxOffsetPx / 2 ? maxOffsetPx : 0
}

/**
 * One critically damped spring frame (semi-implicit Euler). Position and
 * velocity share the gesture's sign convention: positive pulls the sheet
 * down toward peek. Carrying `velocity` from the release is what removes
 * the seam between the drag and the animation.
 */
export function springStep(
  position: number,
  velocity: number,
  target: number,
  dtS: number,
  responseS: number = SHEET_RESPONSE_S,
): { position: number; velocity: number } {
  const omega = (2 * Math.PI) / responseS
  const accel = omega * omega * (target - position) - 2 * omega * velocity
  const nextVelocity = velocity + accel * dtS
  return { position: position + nextVelocity * dtS, velocity: nextVelocity }
}
