import { describe, expect, it } from 'vitest';
import { EXPORT_PIXEL_RATIO, RATIO_INFO, ratioLabel } from './ratios';

describe('ratioLabel', () => {
  it('advertises exported pixels (preview × EXPORT_PIXEL_RATIO), not preview pixels', () => {
    expect(ratioLabel('1:1')).toBe('Square (1800 × 1800 px) — Threads, X, Instagram');
    expect(ratioLabel('4:5')).toBe('Portrait (1600 × 2000 px) — Tối ưu màn hình Mobile');
    expect(ratioLabel('16:9')).toBe('Landscape (2000 × 1125 px) — X Card, Facebook Post');
  });

  it('never drifts from the RATIO_INFO dimensions', () => {
    for (const ratio of Object.keys(RATIO_INFO) as (keyof typeof RATIO_INFO)[]) {
      const { width, height } = RATIO_INFO[ratio];
      expect(ratioLabel(ratio)).toContain(
        `${width * EXPORT_PIXEL_RATIO} × ${height * EXPORT_PIXEL_RATIO} px`
      );
    }
  });
});
