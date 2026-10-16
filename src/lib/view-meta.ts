// Crawl-facing identity for the three views. The deploy serves one HTML
// for every /social-card/* path, so index.html ships the landing's title,
// description, canonical and Open Graph tags statically — share-card
// scrapers never run JavaScript. applyViewMeta then aligns the title,
// canonical and og:url with the view the catch-all actually served, for
// the crawlers (and tabs) that do.

import { FEEDBACK_PATH, LANDING_PATH, STUDIO_PATH, type ViewName } from './view-route'

// Every crawl-facing URL is absolute off the deployed origin.
export const SITE_URL = 'https://workboost.qzz.io'

// Titles are crawl surface, not UI Copy: English-only under the EN-first
// meta decision (ADR 0008), so the VI/EN toggle deliberately never reaches
// the tab.
export const VIEW_META: Record<ViewName, { title: string; path: string }> = {
  landing: { title: 'Social Card — Minimalist Card Studio', path: LANDING_PATH },
  studio: { title: 'Social Card — Studio', path: STUDIO_PATH },
  feedback: { title: 'Social Card — Feedback', path: FEEDBACK_PATH },
}

// Dedicated SERP copy for meta + og:description — it must carry the
// free/no-account hook that earns the click; the on-page hero lede
// deliberately doesn't.
export const SEO_DESCRIPTION =
  'Create share-ready card images for Threads, X & Facebook in under a minute — Quote Cards, Showcase Cards, a QR call-to-action, pixel-exact Retina PNG. Free, no account, nothing to install.'

// The hand-rendered share preview (public/og.png, 16:9 at 2000×1125),
// reached through the same vercel.json rewrite as the favicon.
export const OG_PREVIEW_URL = `${SITE_URL}${LANDING_PATH}/og.png`

// Describes the rendered artwork, not the page — true this up whenever the
// preview render changes.
export const OG_PREVIEW_ALT =
  'The Social Card studio on desktop: a glass Inspector on the left, a Showcase card on the dot canvas'

export function canonicalUrl(view: ViewName): string {
  return SITE_URL + VIEW_META[view].path
}

// Full-page-load navigation fixes the view for the document's whole life,
// so one call at boot in main.tsx covers it — nothing reactive, and the
// correct title is already set while the view chunk is still loading.
export function applyViewMeta(view: ViewName): void {
  document.title = VIEW_META[view].title
  const url = canonicalUrl(view)
  // The static tags exist in index.html (their presence is pinned by
  // view-meta-static.test.ts); update-only keeps this a pure alignment
  // pass, not head construction.
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url)
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', url)
}
