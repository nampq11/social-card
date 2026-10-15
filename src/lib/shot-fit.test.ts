import { describe, expect, it } from 'vitest'
import {
  autoFitForSlot,
  momentumFocus,
  springStep,
  clampFocus,
  DEFAULT_SHOT_FOCUS,
  focusForPinch,
  focusFromDrag,
  projectedFocus,
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

// Drag-to-pan math (ADR 0006 §3): px deltas from the pointer become focus
// deltas against the zoomed cover overflow, with rubber-band excess past an
// edge. Dragging the image right (dx > 0) brings the left edge into view,
// so focus moves AGAINST the pointer.
describe('focusFromDrag', () => {
  const g = { slotWidth: 300, slotHeight: 150, naturalWidth: 900, naturalHeight: 300 }

  it('maps drag px to focus px against a wide image overflow', () => {
    // 900×300 in a 300×150 slot covers at scale 0.5 → 450×150 → 150px of
    // horizontal overflow, none vertical.
    const next = focusFromDrag({ x: 0.5, y: 0.5 }, 75, 40, g, 1)
    expect(next.focus.x).toBeCloseTo(0) // 0.5 - 75/150
    expect(next.focus.y).toBeCloseTo(0.5) // no vertical overflow, no movement
    expect(next.overdrag).toEqual({ x: 0, y: 0 })
  })

  it('pans vertically when a tall image overflows that axis', () => {
    // 800×450 in 300×150 covers at 0.375 → 300×168.75 → 18.75px vertical.
    const tall = { slotWidth: 300, slotHeight: 150, naturalWidth: 800, naturalHeight: 450 }
    const next = focusFromDrag({ x: 0.5, y: 0 }, 10, 18.75, tall, 1)
    expect(next.focus.x).toBeCloseTo(0.5)
    expect(next.focus.y).toBeCloseTo(0)
  })

  it('clamps the result so the slot never shows past the image', () => {
    // 400×800 in 300×150 overflows only vertically (rendered 300×600).
    const portrait = { slotWidth: 300, slotHeight: 150, naturalWidth: 400, naturalHeight: 800 }
    const next = focusFromDrag({ x: 0.9, y: 0.9 }, -1000, -1000, portrait, 1)
    expect(next.focus.x).toBe(0.9) // no horizontal overflow, that axis is inert
    expect(next.focus.y).toBe(1)
  })

  it('is a no-op on any axis without overflow (and for zero sizes)', () => {
    const start = { x: 0.3, y: 0.4 }
    const inert = { focus: start, overdrag: { x: 0, y: 0 } }
    expect(focusFromDrag(start, 500, 500, { ...g, naturalWidth: 600 }, 1)).toEqual(inert)
    expect(
      focusFromDrag(
        start,
        500,
        500,
        { slotWidth: 0, slotHeight: 0, naturalWidth: 0, naturalHeight: 0 },
        1,
      ),
    ).toEqual(inert)
  })

  it('rubber-bands past an edge: focus pegs, the excess is sublinear', () => {
    // 150px of overflow; a 100px drag from focus 0.5 overshoots 25px past
    // the left edge.
    const next = focusFromDrag({ x: 0.5, y: 0.5 }, 100, 0, g, 1)
    expect(next.focus.x).toBe(0)
    expect(next.overdrag.x).toBeGreaterThan(0)
    expect(next.overdrag.x).toBeLessThan(25)
  })

  it("resists more the deeper the overdrag (Apple's form)", () => {
    const shallow = focusFromDrag({ x: 0.5, y: 0.5 }, 100, 0, g, 1).overdrag.x
    const deep = focusFromDrag({ x: 0.5, y: 0.5 }, 175, 0, g, 1).overdrag.x
    expect(deep).toBeGreaterThan(shallow)
    // The extra 75px of depth bought less than 75px of extra excess.
    expect(deep - shallow).toBeLessThan(75)
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
  const g = { slotWidth: 300, slotHeight: 150, naturalWidth: 900, naturalHeight: 300 }

  it('overflow grows with zoom: the same px drag moves focus less', () => {
    // Unzoomed: 150px of horizontal overflow → 75px lands exactly on the edge.
    expect(focusFromDrag({ x: 0.5, y: 0.5 }, 75, 0, g, 1).focus.x).toBe(0)
    // At scale 2 the content is 900px wide → 600px overflow → same 75px is a
    // smaller focus step.
    expect(focusFromDrag({ x: 0.5, y: 0.5 }, 75, 0, g, 2).focus.x).toBeCloseTo(0.375)
  })

  it('both axes pan once zoomed past the slot', () => {
    // 900×300 at scale 2 renders 900×300 — the vertical axis now has 150px
    // of overflow, so 75px is exactly half of it.
    const next = focusFromDrag({ x: 0.5, y: 0.5 }, 0, 75, g, 2)
    expect(next.focus.y).toBe(0)
    expect(next.focus.x).toBeCloseTo(0.5)
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
  const g = { slotWidth: 300, slotHeight: 150, naturalWidth: 900, naturalHeight: 300 }
  const mid = { x: 0.5, y: 0.5 }

  it('a centered pinch stays centered', () => {
    expect(focusForPinch({ x: 0.5, y: 0.5 }, 1, 2, mid, mid, g)).toEqual({ x: 0.5, y: 0.5 })
  })

  it('zooming on an off-center anchor keeps that content point under the fingers', () => {
    // With the right edge shown (x=1), box fraction 0.75 holds content
    // fraction 5/6; after doubling the scale the anchor must land at 7/8.
    const p = { x: 0.75, y: 0.5 }
    const next = focusForPinch({ x: 1, y: 0.5 }, 1, 2, p, p, g)
    expect(next.x).toBeCloseTo(0.875, 5)
    // ...and re-deriving the content fraction at the midpoint returns 5/6.
    const content = next.x + (p.x - next.x) * (g.slotWidth / (900 * 0.5 * 2))
    expect(content).toBeCloseTo(5 / 6, 5)
  })

  it('midpoint travel pans with the zoom, not against it', () => {
    const from = { x: 0.5, y: 0.5 }
    const to = { x: 0.7, y: 0.5 }
    const next = focusForPinch(from, 1, 2, from, to, g)
    expect(next.x).not.toEqual(from.x)
  })

  it('zooming an axis that had no overflow anchors about the midpoint', () => {
    // Vertical axis is inert unzoomed (content height == slot height), so the
    // content fraction under the midpoint is the midpoint itself — the pinch
    // grows the image about the fingers, landing at the re-anchored value.
    expect(focusForPinch({ x: 0.5, y: 0.3 }, 1, 2, mid, mid, g).y).toBe(0.5)
  })
})

// Momentum projection (ADR 0006 §3): the release velocity is tracked in
// screen px/s and must convert through the preview's CSS scale before the
// projection — the review regression: the old hook math mixed layout px
// (content render) with screen px (slot/previewScale), which went negative
// under a CSS-scaled preview and killed momentum entirely.
describe('momentumFocus', () => {
  const g = { slotWidth: 300, slotHeight: 150, naturalWidth: 900, naturalHeight: 300 }

  it('keeps the overflow domain real when the preview is scaled down', () => {
    // Unzoomed shot: 150px of layout overflow. The old formula computed
    // 450 - 300/0.5 = -150 → inert; converting velocity instead keeps the
    // domain, and the flick coasts to the edge.
    expect(momentumFocus({ x: 0.5, y: 0.5 }, 200, 0, 0.5, g, 1).focus.x).toBe(0)
  })

  it("a half-size preview doubles the same screen flick's layout speed", () => {
    // Scale 2: 600px of overflow. 600 screen px/s coasts 299.4px →
    // 0.5 − 299.4/600 = 0.001. Through a 0.5 preview the same flick is
    // 1200 layout px/s → past the edge.
    expect(momentumFocus({ x: 0.5, y: 0.5 }, 600, 0, 1, g, 2).focus.x).toBeCloseTo(0.001, 5)
    expect(momentumFocus({ x: 0.5, y: 0.5 }, 600, 0, 0.5, g, 2).focus.x).toBe(0)
  })

  it('is inert on an axis without overflow', () => {
    const outcome = momentumFocus({ x: 0.5, y: 0.5 }, 0, 5000, 1, g, 1)
    expect(outcome.focus.y).toBeCloseTo(0.5)
    // No overflow — no velocity handoff for the settle spring either.
    expect(outcome.velocity.y).toBe(0)
  })

  it('hands the release velocity to the settle spring in focus units', () => {
    // 600 layout px/s against 600px of overflow (scale 2) = 1 focus unit/s,
    // signed AGAINST the pointer (a rightward flick coasts leftward).
    expect(momentumFocus({ x: 0.5, y: 0.5 }, 600, 0, 1, g, 2).velocity.x).toBeCloseTo(-1, 5)
  })

  // Settle spring (ADR 0006 §3): critically damped (ratio 1.0) in closed form,
  // so two half-length steps land exactly where one full step does (jank-safe)
  // and a release velocity hands off without a kink.
  describe('springStep', () => {
    const RESPONSE = 0.3

    it('never overshoots the target from rest', () => {
      let state = { value: 1, velocity: 0 }
      let previous = state.value
      for (let i = 0; i < 200; i++) {
        state = springStep(state, 0, 16, RESPONSE)
        // Monotone approach: it may touch the target but never cross it.
        expect(state.value).toBeLessThanOrEqual(previous + 1e-12)
        expect(state.value).toBeGreaterThanOrEqual(0)
        previous = state.value
      }
      expect(state.value).toBeCloseTo(0, 3)
    })

    it('composes: two half steps land where one full step does', () => {
      const halfA = springStep({ value: 0.9, velocity: -3 }, 0.2, 8, RESPONSE)
      const halfB = springStep(halfA, 0.2, 8, RESPONSE)
      const whole = springStep({ value: 0.9, velocity: -3 }, 0.2, 16, RESPONSE)
      expect(halfB.value).toBeCloseTo(whole.value, 10)
      expect(halfB.velocity).toBeCloseTo(whole.velocity, 10)
    })

    it('carries velocity: a fast entry approaches faster than from rest', () => {
      const rest = springStep({ value: 1, velocity: 0 }, 0, 16, RESPONSE)
      const moving = springStep({ value: 1, velocity: -50 }, 0, 16, RESPONSE)
      expect(moving.value).toBeLessThan(rest.value)
      // ...and the closed form's velocity decays without sign flips back
      // toward the target: no oscillation.
      expect(moving.velocity).toBeLessThanOrEqual(0)
    })

    it('settles: position and velocity both reach the target', () => {
      let state = { value: 1, velocity: -80 }
      for (let i = 0; i < 400; i++) state = springStep(state, 0, 16, RESPONSE)
      expect(Math.abs(state.value)).toBeLessThan(0.001)
      expect(Math.abs(state.velocity)).toBeLessThan(0.05)
    })

    it('is inert for a non-advancing clock', () => {
      const state = { value: 0.7, velocity: 2 }
      expect(springStep(state, 0, 0, RESPONSE)).toEqual(state)
    })
  })
})
