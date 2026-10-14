import { describe, expect, it } from 'vitest'
import {
  SHEET_MIN_CHROME_PX,
  projectionDistance,
  rubberbandDistance,
  sheetExpandedPx,
  snapSheetTarget,
  springStep,
} from './sheet-drag'

describe('sheetExpandedPx', () => {
  it('targets 58dvh when the viewport has headroom', () => {
    // 0.58 × 844 ≈ 490; headroom 844 − 110 − 150 = 584 does not bind.
    expect(sheetExpandedPx(844)).toBe(490)
  })

  it('keeps a small portrait phone inside its headroom', () => {
    // SE-class 667px: 58% would be 387; headroom 667 − 110 − 150 = 407 —
    // the header-only chrome count no longer binds at this height.
    expect(sheetExpandedPx(667)).toBe(387)
  })

  it('falls back to a minimum working height on landscape phones', () => {
    // 390px landscape has no headroom; the sheet still needs to expand.
    expect(sheetExpandedPx(390)).toBe(SHEET_MIN_CHROME_PX + 120)
  })
})

describe('rubberbandDistance', () => {
  it('returns no resistance at the boundary', () => {
    expect(rubberbandDistance(0, 400)).toBe(0)
  })

  it('resists progressively: double the overshoot is well under double the travel', () => {
    const short = rubberbandDistance(100, 400)
    const long = rubberbandDistance(200, 400)
    expect(short).toBeGreaterThan(0)
    expect(long).toBeGreaterThan(short)
    expect(long).toBeLessThan(short * 2)
    // and it never exceeds the raw overshoot
    expect(long).toBeLessThan(200)
  })
})

describe('projectionDistance', () => {
  it('projects nowhere at rest', () => {
    expect(projectionDistance(0)).toBe(0)
  })

  it('projects further for faster flicks, in the flick direction', () => {
    expect(projectionDistance(1000)).toBeGreaterThan(projectionDistance(500))
    expect(projectionDistance(-1000)).toBeLessThan(0)
  })
})

describe('snapSheetTarget', () => {
  const maxOffset = 346 // 490px expanded − 144px peek

  it('a downward flick from anywhere open closes the sheet', () => {
    // Offset 40 (mostly open), flicking down at 1200px/s.
    expect(snapSheetTarget(40, 1200, maxOffset)).toBe(maxOffset)
  })

  it('an upward flick from mostly closed opens the sheet', () => {
    expect(snapSheetTarget(300, -1200, maxOffset)).toBe(0)
  })

  it('a slow release settles to the nearer resting point', () => {
    expect(snapSheetTarget(40, 0, maxOffset)).toBe(0)
    expect(snapSheetTarget(300, 0, maxOffset)).toBe(maxOffset)
  })
})

describe('springStep', () => {
  const settle = (from: number, velocity: number, target: number) => {
    let position = from
    let v = velocity
    // 0.8s of 16ms frames is well past a critically damped 0.3s response.
    for (let t = 0; t < 0.8; t += 0.016) {
      ;({ position, velocity: v } = springStep(position, v, target, 0.016))
    }
    return { position, velocity: v }
  }

  it('settles on the target from rest', () => {
    const { position, velocity } = settle(346, 0, 0)
    expect(Math.abs(position)).toBeLessThan(1)
    expect(Math.abs(velocity)).toBeLessThan(1)
  })

  it('carries release velocity toward the target instead of stalling', () => {
    // Same 346px to travel; a 2000px/s head start must cover more ground
    // over the same early window than a release from rest.
    let withVelocity = 346
    let fromRest = 346
    // Toward target 0 from offset 346 means moving up: negative velocity.
    let v1 = -2000
    let v2 = 0
    for (let t = 0; t < 0.16; t += 0.016) {
      ;({ position: withVelocity, velocity: v1 } = springStep(withVelocity, v1, 0, 0.016))
      ;({ position: fromRest, velocity: v2 } = springStep(fromRest, v2, 0, 0.016))
    }
    expect(Math.abs(withVelocity)).toBeLessThan(Math.abs(fromRest))
    expect(fromRest).toBeGreaterThan(0)
  })

  it('never overshoots past the target (critically damped)', () => {
    let position = 346
    let velocity = 0
    let min = position
    for (let t = 0; t < 0.8; t += 0.016) {
      ;({ position, velocity } = springStep(position, velocity, 0, 0.016))
      min = Math.min(min, position)
    }
    // Closing toward 0 must not dip below it.
    expect(min).toBeGreaterThanOrEqual(-0.5)
  })
})
