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
