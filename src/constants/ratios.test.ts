import { describe, expect, it } from 'vitest'
import { RATIO_INFO, ratioLabel } from './ratios'
import type { AspectRatio } from '../types'
import type { Language } from '../lib/i18n'

// Expected labels are hand-pinned from the spec (preview px × 2.5 export
// multiplier: 720×2.5=1800, 640×2.5=1600, 800×2.5=2000, 450×2.5=1125) —
// NOT recomputed from RATIO_INFO, so a wrong dimension or label format in
// the registry turns these red instead of adapting to it.
const PINNED_LABELS: [AspectRatio, Language, string][] = [
  ['1:1', 'vi', 'Square (1800 × 1800 px) — Threads, X, Instagram'],
  ['1:1', 'en', 'Square (1800 × 1800 px) — Threads, X, Instagram'],
  ['4:5', 'vi', 'Portrait (1600 × 2000 px) — Tối ưu màn hình Mobile'],
  ['4:5', 'en', 'Portrait (1600 × 2000 px) — Optimized for mobile screens'],
  ['16:9', 'vi', 'Landscape (2000 × 1125 px) — X Card, Facebook Post'],
  ['16:9', 'en', 'Landscape (2000 × 1125 px) — X Card, Facebook Post'],
]

describe('ratioLabel', () => {
  it.each(PINNED_LABELS)('advertises exported pixels (%s, %s)', (ratio, language, expected) => {
    expect(ratioLabel(ratio, language)).toBe(expected)
  })

  it('pins every ratio in the registry — a new one must get a row above', () => {
    expect(new Set(PINNED_LABELS.map(([ratio]) => ratio))).toEqual(new Set(Object.keys(RATIO_INFO)))
  })
})
