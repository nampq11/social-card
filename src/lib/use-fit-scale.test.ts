import { describe, expect, it } from 'vitest';
import {
  MAX_FIT_SCALE,
  computeFitScale,
} from './use-fit-scale';

describe('computeFitScale', () => {
  it('fits a landscape card by width in a tall container', () => {
    // 800×450 card in 720×900 of canvas: width is the binding side.
    expect(computeFitScale(720, 900, 800, 450)).toBe(0.9);
  });

  it('fits a portrait card by height in a narrow container', () => {
    // 640×800 card in 600×900 of canvas: height is the binding side.
    expect(computeFitScale(600, 900, 640, 800)).toBeCloseTo(0.9375);
  });

  it('never upscales past the card natural size', () => {
    expect(computeFitScale(5000, 5000, 720, 720)).toBe(MAX_FIT_SCALE);
  });

  it('shrinks both dimensions together to keep the ratio', () => {
    const scale = computeFitScale(400, 300, 720, 720);
    expect(720 * scale).toBeLessThanOrEqual(400);
    expect(720 * scale).toBeLessThanOrEqual(300);
  });

  it('returns 0 while the container has no measurable size', () => {
    expect(computeFitScale(0, 500, 720, 720)).toBe(0);
    expect(computeFitScale(500, 0, 720, 720)).toBe(0);
  });

  it('returns 0 for a degenerate card size', () => {
    expect(computeFitScale(500, 500, 0, 720)).toBe(0);
  });
});
