# ADR 0008: English-first static crawl meta

- **Status:** Accepted
- **Date:** 2026-10-16
- **Deciders:** Nam Pham
- **Related:** ADR 0007 §5 (index.html pre-mount literals), `src/lib/view-meta.ts`, `src/lib/view-meta-static.test.ts`

## Context

The deploy serves one `index.html` for every `/social-card/*` path (vercel.json
catch-all), and the page is client-rendered — the body is an empty `#root` until
JS runs. Share-card scrapers (X, Facebook, Slack, iMessage) never execute JS,
so the static head is the _only_ content they ever see; before this ADR it held
a title, one description, and three bare Open Graph tags, with no preview
artwork at all. Meanwhile the in-page UI defaults to Vietnamese while the
title was English, and no view (landing / studio / feedback) had its own tab
title or canonical.

## Decision

### 1. English-first static crawl meta, owned by one module

Everything a non-JS consumer reads is static English in `index.html`:
title, description, canonical, the Open Graph suite (including
`og:image` + width/height/alt), `twitter:card`, `theme-color`, and a static
FAQPage JSON-LD. `src/lib/view-meta.ts` owns the strings (`SITE_URL`,
`VIEW_META`, `SEO_DESCRIPTION`, `OG_PREVIEW_*`) and
`view-meta-static.test.ts` pins the files to the module — drift is a red
`pnpm check`, not a stale comment. The description is dedicated SERP copy
carrying the free/no-account hook, not the hero lede. `<html lang>` flips to
`en` to match the static document; the i18n provider's existing mount effect
retunes it to the visitor's Interface Language.

### 2. Boot-time alignment, not runtime meta management

Views are full-page loads (no router), so the view is fixed for a document's
whole life: `main.tsx` calls `applyViewMeta(view)` once after `resolveView`.
It aligns `document.title`, `link[rel=canonical]`, and `og:url` with the
served view for JS-running crawlers and tabs; it never constructs missing
tags (the static shell is the contract). Tab titles are crawl surface, not
UI Copy — English-only, deliberately out of reach of the VI/EN toggle.

### 3. Canonical form and sitemap membership

Canonical = `SITE_URL + path` with no trailing slash (matches the root
redirect's destination and every internal link). The sitemap lists exactly
the three view canonicals — a zero-thought rule derived from `VIEW_META`,
pinned by test.

### 4. One twitter tag; manual icon assets

`twitter:card = summary_large_image` is the only `twitter:*` tag — X falls
back to `og:title/description/image`, and duplicating them is pure drift
surface. `og.png` (2000×1125, hand-rendered in the product's own studio) and
`apple-touch-icon.png` (180×180) are manual assets in `public/`, served via
vercel.json rewrites like the favicon; the static test asserts they exist so
a forgotten render cannot ship as a silent 404 preview. No `favicon.ico`,
no PWA manifest, no `og:image:type`/`secure_url`, no hreflang (no per-locale
URLs exist).

## Consequences

- Editing the EN FAQ or any crawl string is a two-file change (dictionary or
  module + `index.html`) with a loud failing test in between.
- Vietnamese-UI visitors see English tab titles; non-JS crawlers see landing
  meta on every path, which the canonical consolidates to the landing.
- `applyViewMeta` writing production canonicals in dev is accepted — head
  tags don't affect dev UX, and being origin-unaware keeps it one-shot.
- If real prerendering/SSG ever lands, revisit §2 (per-view static HTML
  replaces the alignment pass) and the sitemap rule stays as-is.
