import { describe, expect, it } from 'vitest'
import { landingDictionaries } from './landing-copy'

// Recursive shape parity: same keys at every level, arrays of the same
// length with matching item shapes. The compiler already enforces this via
// `en: typeof vi`; the runtime check guards refactors that widen types
// (e.g. optional fields) the compiler alone would let through.
function expectSameShape(a: unknown, b: unknown, path: string) {
  if (Array.isArray(a) || Array.isArray(b)) {
    expect(Array.isArray(a) && Array.isArray(b), `${path}: both must be arrays`).toBe(true)
    expect(a as unknown[]).toHaveLength((b as unknown[]).length)
    ;(a as unknown[]).forEach((item, i) =>
      expectSameShape(item, (b as unknown[])[i], `${path}[${i}]`),
    )
    return
  }
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const recordA = a as Record<string, unknown>
    const recordB = b as Record<string, unknown>
    expect(Object.keys(recordA).sort(), `${path}: key sets`).toEqual(Object.keys(recordB).sort())
    for (const key of Object.keys(recordA)) {
      expectSameShape(recordA[key], recordB[key], `${path}.${key}`)
    }
    return
  }
  expect(typeof b, `${path}: value types`).toBe(typeof a)
}

describe('landing dictionary parity', () => {
  it('keeps identical shapes for both languages, list lengths included', () => {
    expectSameShape(landingDictionaries.vi, landingDictionaries.en, 'root')
  })

  it('ships the same number of feature-grid, how-to and FAQ entries in both languages', () => {
    expect(landingDictionaries.en.grid_items).toHaveLength(landingDictionaries.vi.grid_items.length)
    expect(landingDictionaries.en.how_steps).toHaveLength(landingDictionaries.vi.how_steps.length)
    expect(landingDictionaries.en.faq_items).toHaveLength(landingDictionaries.vi.faq_items.length)
    expect(landingDictionaries.en.marquee_items).toHaveLength(
      landingDictionaries.vi.marquee_items.length,
    )
  })
})
