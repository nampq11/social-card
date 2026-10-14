import { describe, expect, it } from 'vitest'
import {
  autoFitForSlot,
  clampFocus,
  DEFAULT_SHOT_FOCUS,
  focusForPinch,
  focusFromDrag,
  projectedFocus,
  rubberbandDelta,
  shotAnchorCss,
} from './shot-fit'

// Focus is the normalized 0..1 anchor of which part of a Shot shows when it
// crops inside its Slot (GLOSSARY.md "Focus"). Cover pans; Fit (contain)
// shows the whole Shot, so Focus is irrelevant and forced centered.
describe('clampFocus', () => {
  it('defaults to top-center, reproducing the old object-top render', () => {
    expect(DEFAULT_SHOT_FOCUS).toEqual({ x: 0.5, y: 0 })
  })

  it('keeps in-range cover focus untouched', () => {
    expect(clampFocus({ x: 0.2, y: 0.8 }, 'cover')).toEqual({ x: 0.2, y: 0.8 })
  })

  it('clamps cover focus into 0..1 from every side', () => {
    expect(clampFocus({ x: -0.4, y: 1.7 }, 'cover')).toEqual({ x: 0, y: 1 })
    expect(clampFocus({ x: 2, y: -3 }, 'cover')).toEqual({ x: 1, y: 0 })
  })

  it('treats non-numeric focus axes as neutral (0.5)', () => {
    expect(clampFocus({ x: Number.NaN, y: Number.NaN }, 'cover')).toEqual({ x: 0.5, y: 0.5 })
  })

  it('centers focus under Fit — pan is meaningless when the whole Shot shows', () => {
    expect(clampFocus({ x: 0.9, y: 0.1 }, 'contain')).toEqual({ x: 0.5, y: 0.5 })
  })
})

// object-position is the browser-native focus renderer (ADR 0005, amended):
// cover + focus maps straight to percentages; Fit (contain) centers.
describe('shotAnchorCss', () => {
  it('maps the default top-center focus to the original object-top render', () => {
    expect(shotAnchorCss(DEFAULT_SHOT_FOCUS, 'cover')).toBe('50% 0%')
  })

  it('maps focus edges to object-position edges', () => {
    expect(shotAnchorCss({ x: 0, y: 1 }, 'cover')).toBe('0% 100%')
    expect(shotAnchorCss({ x: 1, y: 0.25 }, 'cover')).toBe('100% 25%')
  })

  it('centers under Fit — the anchor is irrelevant when nothing crops', () => {
    expect(shotAnchorCss({ x: 0.9, y: 0.1 }, 'contain')).toBe('50% 50%')
  })

  it('never emits an out-of-range position, whatever it is handed', () => {
    expect(shotAnchorCss({ x: -2, y: 7 }, 'cover')).toBe('0% 100%')
  })
})

// Drag-to-pan math (ADR 0005): px deltas from the pointer become focus
// deltas against the cover overflow. Dragging the image right (dx > 0)
// brings the left edge into view, so focus moves AGAINST the pointer.
describe('focusFromDrag', () => {
  const slot = { width: 300, height: 150 }

  it('maps drag px to focus px against a wide image overflow', () => {
    // 900×300 in a 300×150 slot covers at scale 0.5 → 450×150 → 150px of
    // horizontal overflow, none vertical.
    const next = focusFromDrag({ x: 0.5, y: 0.5 }, 75, 40, slot.width, slot.height, 900, 300)
    expect(next.x).toBeCloseTo(0) // 0.5 - 75/150
    expect(next.y).toBeCloseTo(0.5) // no vertical overflow, no movement
  })

  it('pans vertically when a tall image overflows that axis', () => {
    // 800×450 in 300×150 covers at 0.375 → 300×168.75 → 18.75px vertical.
    const next = focusFromDrag({ x: 0.5, y: 0 }, 10, 18.75, slot.width, slot.height, 800, 450)
    expect(next.x).toBeCloseTo(0.5)
    expect(next.y).toBeCloseTo(0)
  })

  it('clamps the result so the slot never shows past the image', () => {
    // 400×800 in 300×150 overflows only vertically (rendered 300×600).
    const next = focusFromDrag({ x: 0.9, y: 0.9 }, -1000, -1000, slot.width, slot.height, 400, 800)
    expect(next.x).toBe(0.9) // no horizontal overflow, that axis is inert
    expect(next.y).toBe(1)
  })

  it('is a no-op on any axis without overflow (and for zero sizes)', () => {
    const start = { x: 0.3, y: 0.4 }
    expect(focusFromDrag(start, 500, 500, 300, 150, 600, 300)).toEqual(start)
    expect(focusFromDrag(start, 500, 500, 0, 0, 0, 0)).toEqual(start)
  })

  it('keeps a Fit shot centered — pan is meaningless there', () => {
    expect(
      focusFromDrag({ x: 0.5, y: 0.5 }, 75, 75, slot.width, slot.height, 900, 300, 'contain'),
    ).toEqual({
      x: 0.5,
      y: 0.5,
    })
  })
})

// ADR 0006 auto-fit: absent an override, the effective Fit derives from the
// shot-to-slot ratio — near matches keep cover, mismatches go contain so a
// screenshot is never silently cropped by default.
describe('autoFitForSlot (issue #38)', () => {
  it('keeps cover when ratios are near (within ~20%)', () => {
    // 4:3 image in the ~1.25 hero slot: 1.33 vs 1.26 — a match.
    expect(autoFitForSlot(1600, 1200, 529, 421)).toBe('cover')
  })

  it('picks contain for a much wider shot (16:9 in the hero slot)', () => {
    expect(autoFitForSlot(1600, 900, 529, 421)).toBe('contain')
  })

  it('picks contain for a much taller shot (portrait capture)', () => {
    expect(autoFitForSlot(900, 1600, 529, 421)).toBe('contain')
  })

  it('keeps cover on degenerate zero measurements (the pre-measure render)', () => {
    expect(autoFitForSlot(0, 0, 529, 421)).toBe('cover')
    expect(autoFitForSlot(1600, 900, 0, 0)).toBe('cover')
  })
})

// Scale (ADR 0006 §4): zoom multiplies the cover-rendered content; overflow
// grows with it, so pan stays 1:1 at every zoom level and both axes gain
// overflow once zoomed.
describe('focusFromDrag under Scale', () => {
  const slot = { width: 300, height: 150 }

  it('scale 1 (and absent) is exactly the unzoomed behavior', () => {
    const args = [{ x: 0.5, y: 0.5 }, 75, 40, slot.width, slot.height, 900, 300] as const
    expect(focusFromDrag(...args)).toEqual(focusFromDrag(...args, 'cover', 1))
  })

  it('overflow grows with zoom: the same px drag moves focus less', () => {
    // Unzoomed: 150px of horizontal overflow → 75px lands exactly on the edge.
    expect(focusFromDrag({ x: 0.5, y: 0.5 }, 75, 0, slot.width, slot.height, 900, 300).x).toBe(0)
    // At scale 2 the content is 900px wide → 600px overflow → same 75px is a
    // smaller focus step.
    expect(
      focusFromDrag({ x: 0.5, y: 0.5 }, 75, 0, slot.width, slot.height, 900, 300, 'cover', 2).x,
    ).toBeCloseTo(0.375)
  })

  it('both axes pan once zoomed past the slot', () => {
    // 900×300 at scale 2 renders 900×300 — the vertical axis now has
    // 150px of overflow, so 75px is exactly half of it.
    const next = focusFromDrag(
      { x: 0.5, y: 0.5 },
      0,
      75,
      slot.width,
      slot.height,
      900,
      300,
      'cover',
      2,
    )
    expect(next.y).toBeCloseTo(0)
  })
})

// Rubber-banding (ADR 0006 §3, WWDC18 803): overdrag past an edge follows the
// pointer with progressive resistance instead of stopping dead.
describe('rubberbandDelta', () => {
  it('is zero at the boundary', () => {
    expect(rubberbandDelta(0, 300)).toBe(0)
  })

  it('always yields less than the raw overshoot but never zero while dragging', () => {
    for (const overshoot of [5, 40, 300]) {
      const eased = rubberbandDelta(overshoot, 300)
      expect(eased).toBeGreaterThan(0)
      expect(eased).toBeLessThan(overshoot)
    }
  })

  it('resists progressively — the further past, the smaller the fraction', () => {
    const near = rubberbandDelta(10, 300) / 10
    const far = rubberbandDelta(400, 300) / 400
    expect(far).toBeLessThan(near)
  })
})

// Momentum projection (ADR 0006 §3): a release velocity coasts a projected
// distance, and the nearest valid end wins. Focus moves AGAINST pointer px,
// same sign convention as focusFromDrag.
describe('projectedFocus', () => {
  it('a 1000px/s release coasts ~499px (r = 0.998) against the pointer', () => {
    // overflow 600: 0.5 − 499/600 → clamps to 0.
    expect(projectedFocus(0.5, 1000, 600)).toBe(0)
  })

  it('a soft release barely moves the focus', () => {
    expect(projectedFocus(0.5, 60, 600)).toBeCloseTo(0.5 - (60 * 0.499) / 600, 5)
  })

  it('is clamped into 0..1 on both directions of a violent flick', () => {
    expect(projectedFocus(0.1, -5000, 600)).toBe(1)
    expect(projectedFocus(0.9, 5000, 600)).toBe(0)
  })

  it('is inert on an axis without overflow', () => {
    expect(projectedFocus(0.3, -1000, 0)).toBe(0.3)
  })
})

// Pinch anchoring (ADR 0006 §4): zooming keeps the content point under the
// pinch midpoint stationary; midpoint travel pans.
describe('focusForPinch', () => {
  const slot = { width: 300, height: 150 }
  const mid = { x: 0.5, y: 0.5 }

  it('a centered pinch stays centered', () => {
    const next = focusForPinch(
      { x: 0.5, y: 0.5 },
      1,
      2,
      mid,
      mid,
      slot.width,
      slot.height,
      900,
      300,
    )
    expect(next).toEqual({ x: 0.5, y: 0.5 })
  })

  it('zooming on an off-center anchor keeps that content point under the fingers', () => {
    // With the right edge shown (x=1), box fraction 0.75 holds content
    // fraction 5/6; after doubling the scale the anchor must land at 7/8.
    const p = { x: 0.75, y: 0.5 }
    const next = focusForPinch({ x: 1, y: 0.5 }, 1, 2, p, p, slot.width, slot.height, 900, 300)
    expect(next.x).toBeCloseTo(0.875, 5)
    // ...and re-deriving the content fraction at the midpoint returns 5/6.
    const content = next.x + (p.x - next.x) * (slot.width / (900 * 0.5 * 2))
    expect(content).toBeCloseTo(5 / 6, 5)
  })

  it('midpoint travel pans with the zoom, not against it', () => {
    const from = { x: 0.5, y: 0.5 }
    const to = { x: 0.7, y: 0.5 }
    const next = focusForPinch(from, 1, 2, from, to, slot.width, slot.height, 900, 300)
    expect(next.x).not.toEqual(from.x)
  })

  it('zooming an axis that had no overflow anchors about the midpoint', () => {
    // Vertical axis is inert unzoomed (content height == slot height), so the
    // content fraction under the midpoint is the midpoint itself — the pinch
    // grows the image about the fingers, landing at the re-anchored value.
    const next = focusForPinch(
      { x: 0.5, y: 0.3 },
      1,
      2,
      mid,
      mid,
      slot.width,
      slot.height,
      900,
      300,
    )
    expect(next.y).toBe(0.5)
  })
})
