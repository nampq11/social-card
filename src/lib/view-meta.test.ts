// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { SITE_URL, VIEW_META, applyViewMeta, canonicalUrl } from './view-meta'

// applyViewMeta is an alignment pass over the real shell's tags, never head
// construction — so the head is seeded the way index.html ships it.
beforeEach(() => {
  document.head.innerHTML =
    '<title>stale</title>' +
    '<link rel="canonical" href="https://stale.example" />' +
    '<meta property="og:url" content="https://stale.example" />'
})

describe('applyViewMeta', () => {
  it('titles the tab for each view', () => {
    for (const view of ['landing', 'feedback', 'studio'] as const) {
      applyViewMeta(view)
      expect(document.title).toBe(VIEW_META[view].title)
    }
  })

  it('points canonical and og:url at the served view', () => {
    for (const view of ['landing', 'studio'] as const) {
      applyViewMeta(view)
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
        canonicalUrl(view),
      )
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
        canonicalUrl(view),
      )
    }
  })
})

describe('canonicalUrl', () => {
  it('builds slash-free canonicals off the deployed origin', () => {
    // The trailing-slash-free form matches the root redirect's destination
    // and every internal link — one agreed shape everywhere.
    expect(canonicalUrl('landing')).toBe(`${SITE_URL}/social-card`)
    expect(canonicalUrl('studio')).toBe(`${SITE_URL}/social-card/studio`)
    expect(canonicalUrl('feedback')).toBe(`${SITE_URL}/social-card/feedback`)
  })
})
