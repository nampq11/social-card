import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { landingDictionaries } from '../components/landing/landing-copy'
import {
  OG_PREVIEW_ALT,
  OG_PREVIEW_URL,
  SEO_DESCRIPTION,
  SITE_URL,
  VIEW_META,
  canonicalUrl,
} from './view-meta'

// index.html, robots.txt and sitemap.xml hand-duplicate values owned by
// view-meta.ts (and the EN FAQ dictionary lives in landing-copy.ts). These
// guards turn drift into a red pnpm check — update both sides together.

const projectFile = (relPath: string) =>
  readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), 'utf8')

const indexHtml = projectFile('../../index.html')

// Attribute values may wrap across source lines; compare on collapsed
// whitespace so formatting never fails the contract.
const collapse = (value: string) => value.replace(/\s+/g, ' ').trim()

function attr(html: string, pattern: RegExp): string {
  const found = html.match(pattern)
  if (!found) throw new Error(`no match for ${pattern.source} — was the tag removed?`)
  return collapse(found[1])
}

describe('index.html crawl surface', () => {
  it('declares English as the static document language', () => {
    expect(indexHtml).toMatch(/<html lang="en">/)
  })

  it('titles and describes the landing from view-meta', () => {
    expect(attr(indexHtml, /<title>([^<]*)<\/title>/)).toBe(VIEW_META.landing.title)
    expect(attr(indexHtml, /<meta\s+name="description"\s+content="([^"]*)"/)).toBe(SEO_DESCRIPTION)
    expect(attr(indexHtml, /property="og:title"\s+content="([^"]*)"/)).toBe(VIEW_META.landing.title)
    expect(attr(indexHtml, /property="og:description"\s+content="([^"]*)"/)).toBe(SEO_DESCRIPTION)
  })

  it('canonicalizes and points og:url at the landing', () => {
    expect(attr(indexHtml, /<link rel="canonical" href="([^"]*)"/)).toBe(canonicalUrl('landing'))
    expect(attr(indexHtml, /property="og:url"\s+content="([^"]*)"/)).toBe(canonicalUrl('landing'))
  })

  it('publishes the og preview with declared dimensions', () => {
    expect(attr(indexHtml, /property="og:image"\s+content="([^"]*)"/)).toBe(OG_PREVIEW_URL)
    expect(attr(indexHtml, /property="og:image:width"\s+content="([^"]*)"/)).toBe('2000')
    expect(attr(indexHtml, /property="og:image:height"\s+content="([^"]*)"/)).toBe('1125')
    expect(attr(indexHtml, /property="og:image:alt"\s+content="([^"]*)"/)).toBe(OG_PREVIEW_ALT)
  })

  it('sets the og site identity and the large X card type', () => {
    expect(attr(indexHtml, /property="og:site_name"\s+content="([^"]*)"/)).toBe('Social Card')
    expect(attr(indexHtml, /property="og:locale"\s+content="([^"]*)"/)).toBe('en_US')
    expect(attr(indexHtml, /name="twitter:card"\s+content="([^"]*)"/)).toBe('summary_large_image')
  })

  it('tints browser chrome with the canvas tokens from index.css', () => {
    const css = projectFile('../../src/index.css')
    // Two declarations by contract (ADR 0007): the @theme light value,
    // then the dark-mode override.
    const canvas = [...css.matchAll(/--color-canvas:\s*(#\w{6})/g)].map((m) => m[1])
    expect(
      attr(
        indexHtml,
        /name="theme-color" media="\(prefers-color-scheme: light\)" content="([^"]*)"/,
      ),
    ).toBe(canvas[0])
    expect(
      attr(
        indexHtml,
        /name="theme-color" media="\(prefers-color-scheme: dark\)" content="([^"]*)"/,
      ),
    ).toBe(canvas[1])
  })

  it('links the hand-rendered home-screen icon', () => {
    expect(indexHtml).toMatch(/<link rel="apple-touch-icon" href="[^"]*"/)
  })
  it('links standard raster and vector favicons for search crawlers and browsers', () => {
    expect(indexHtml).toMatch(/<link rel="icon" href="\/favicon\.ico" sizes="48x48"/)
    expect(indexHtml).toMatch(/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg/)
    expect(indexHtml).toMatch(
      /<link rel="icon" type="image\/png" sizes="48x48" href="\/favicon-48x48\.png"/,
    )
  })

  it('publishes WebSite structured data for Google site identity', () => {
    const scripts = [
      ...indexHtml.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g),
    ]
    const siteJson = scripts
      .map(
        (m) =>
          JSON.parse(m[1]) as {
            '@type': string
            name?: string
            url?: string
            alternateName?: string[]
          },
      )
      .find((j) => j['@type'] === 'WebSite')
    if (!siteJson) throw new Error('no WebSite JSON-LD script in index.html')
    expect(siteJson.name).toBe('Social Card')
    expect(siteJson.url).toBe(canonicalUrl('landing'))
    expect(siteJson.alternateName).toContain('Social Card Studio')
  })

  it('mirrors the EN FAQ dictionary as FAQPage structured data', () => {
    const scripts = [
      ...indexHtml.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g),
    ]
    const faqJson = scripts
      .map(
        (m) =>
          JSON.parse(m[1]) as {
            '@type': string
            mainEntity?: { name: string; acceptedAnswer: { text: string } }[]
          },
      )
      .find((j) => j['@type'] === 'FAQPage')
    if (!faqJson || !faqJson.mainEntity) throw new Error('no FAQPage JSON-LD script in index.html')
    // Order-inclusive: FAQ order is user-visible on the page too.
    expect(faqJson.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(
      landingDictionaries.en.faq_items.map((item) => [item.question, item.answer]),
    )
  })
})

describe('public crawl files', () => {
  it('lists exactly the three view canonicals in the sitemap', () => {
    const locs = [...projectFile('../../public/sitemap.xml').matchAll(/<loc>([^<]*)<\/loc>/g)].map(
      (m) => collapse(m[1]),
    )
    expect(locs.sort()).toEqual(
      (['landing', 'studio', 'feedback'] as const).map(canonicalUrl).sort(),
    )
  })

  it('points robots.txt at the sitemap', () => {
    expect(projectFile('../../public/robots.txt')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it('ships the og preview, home-screen icon, and favicon assets', () => {
    // Tags pointing at a missing file are a silent 404 preview — fail here
    // instead of in production.
    expect(existsSync(new URL('../../public/og.png', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/apple-touch-icon.png', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/favicon.ico', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/favicon-48x48.png', import.meta.url))).toBe(true)
  })
})
