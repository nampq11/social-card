import { describe, expect, it } from 'vitest'
import { EXPORT_PIXEL_RATIO, RATIO_INFO, ratioLabel } from './ratios'

describe('ratioLabel', () => {
  it('advertises exported pixels (preview × EXPORT_PIXEL_RATIO), not preview pixels', () => {
    expect(ratioLabel('1:1', 'vi')).toBe('Square (1800 × 1800 px) — Threads, X, Instagram')
    expect(ratioLabel('4:5', 'vi')).toBe('Portrait (1600 × 2000 px) — Tối ưu màn hình Mobile')
    expect(ratioLabel('16:9', 'vi')).toBe('Landscape (2000 × 1125 px) — X Card, Facebook Post')
    expect(ratioLabel('4:5', 'en')).toBe('Portrait (1600 × 2000 px) — Optimized for mobile screens')
  })

  it('never drifts from the RATIO_INFO dimensions', () => {
    for (const ratio of Object.keys(RATIO_INFO) as (keyof typeof RATIO_INFO)[]) {
      const { width, height } = RATIO_INFO[ratio]
      for (const language of ['vi', 'en'] as const) {
        expect(ratioLabel(ratio, language)).toContain(
          `${width * EXPORT_PIXEL_RATIO} × ${height * EXPORT_PIXEL_RATIO} px`,
        )
      }
    }
  })
})
