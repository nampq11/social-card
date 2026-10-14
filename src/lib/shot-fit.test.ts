import { describe, expect, it } from 'vitest'
import { clampFocus, DEFAULT_SHOT_FOCUS } from './shot-fit'

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
