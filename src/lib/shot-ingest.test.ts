import { describe, expect, it } from 'vitest'
import { screenshotIngestPolicy } from './shot-ingest'

describe('screenshotIngestPolicy', () => {
  it('keeps screenshots already under the cap untouched', () => {
    expect(screenshotIngestPolicy(800, 600)).toEqual({
      width: 800,
      height: 600,
      mimeType: 'image/jpeg',
      quality: 0.9,
    })
  })

  it('caps an over-wide landscape screenshot on its long edge, keeping aspect', () => {
    expect(screenshotIngestPolicy(3200, 1800)).toEqual({
      width: 1600,
      height: 900,
      mimeType: 'image/jpeg',
      quality: 0.9,
    })
  })

  it('caps an over-tall portrait screenshot on its long edge, keeping aspect', () => {
    expect(screenshotIngestPolicy(1800, 3200)).toEqual({
      width: 900,
      height: 1600,
      mimeType: 'image/jpeg',
      quality: 0.9,
    })
  })

  it('caps a square screenshot on its edge', () => {
    expect(screenshotIngestPolicy(2400, 2400)).toEqual({
      width: 1600,
      height: 1600,
      mimeType: 'image/jpeg',
      quality: 0.9,
    })
  })

  it('preserves the original aspect ratio when capping', () => {
    // 3333×1000 (≈10:3) must stay ≈10:3 after the long edge is capped.
    const original = screenshotIngestPolicy(3333, 1000)
    expect(original.width / original.height).toBeCloseTo(3333 / 1000, 2)
  })

  it('always decides JPEG at quality 0.9, whatever the source format', () => {
    expect(screenshotIngestPolicy(800, 600).mimeType).toBe('image/jpeg')
    expect(screenshotIngestPolicy(4000, 1000)).toMatchObject({
      mimeType: 'image/jpeg',
      quality: 0.9,
    })
  })
})
