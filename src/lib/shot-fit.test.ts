import { describe, expect, it } from 'vitest'
import { clampFocus, DEFAULT_SHOT_FOCUS, focusFromDrag, shotAnchorCss } from './shot-fit'

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
