import { describe, expect, it } from 'vitest'
import { resolveView } from './view-route'

describe('resolveView', () => {
  it('serves the landing at the bare app path and its trailing-slash twin', () => {
    expect(resolveView('/social-card')).toBe('landing')
    expect(resolveView('/social-card/')).toBe('landing')
  })

  it('serves the studio only at its own path', () => {
    expect(resolveView('/social-card/studio')).toBe('studio')
    expect(resolveView('/social-card/studio/')).toBe('studio')
  })

  it('serves the feedback page only at its own path', () => {
    expect(resolveView('/social-card/feedback')).toBe('feedback')
    expect(resolveView('/social-card/feedback/')).toBe('feedback')
  })

  it('falls back to the landing for anything else the catch-all served', () => {
    expect(resolveView('/')).toBe('landing')
    expect(resolveView('/social-card/anything-else')).toBe('landing')
    expect(resolveView('/social-card/feedback-extra')).toBe('landing')
    expect(resolveView('/some/stray/path')).toBe('landing')
  })
})
