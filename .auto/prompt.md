# Autoresearch: Optimize Social Card Web Performance

## Objective

Optimize web performance of Social Card Studio. Reduce initial JavaScript bundle size, improve code-splitting, reduce unnecessary re-renders and memory allocations, streamline asset loading, and minimize cold mount latency while preserving all functionality and ensuring all 328 tests, glossary checks, linting, and formatting pass.

## Metrics

- **Primary**: `entry_js_kb` (kb, lower is better) — the entry JavaScript bundle weight required for cold load.
- **Secondary**:
  - `entry_gzip_kb` — gzipped transfer size of entry JS over network
  - `total_js_kb` — total size across all JS chunks
  - `total_gzip_kb` — total gzipped size across all JS chunks
  - `css_gzip_kb` — gzipped CSS bundle size
  - `mount_ms` — headless Chrome cold load to `#social-card-node` DOM mount
  - `dom_nodes` — DOM node count on canvas mount
  - `build_ms` — production build time

## How to Run

`./.auto/measure.sh` — outputs `METRIC name=number` lines.

## Files in Scope

- `src/App.tsx`: App shell, code-splitting onboarding tour, state subscriptions.
- `src/components/OnboardingTour.tsx`: Lazy loading spotlight tour.
- `src/components/Header.tsx`: Component memoization and prop stabilization.
- `src/components/CardPreview.tsx`: Selective re-rendering and dynamic QR code loading.
- `src/lib/export.ts`: Lazy loading `html-to-image` on demand.
- `src/lib/card-store.ts`: Selector optimization and store action efficiency.
- `index.html`: Web font stylesheet optimization (stripping unused weights/styles).
- `vite.config.ts`: Vite build chunking and minification configuration.

## Off Limits

- Domain vocabulary and contracts in `GLOSSARY.md` (must pass `check-glossary.mjs`).
- Test suite and assertions (do not weaken, delete, or skip tests).
- User-facing features and functionality (all controls, presets, export, shortcuts, gestures must work).

## Constraints

- `./.auto/checks.sh` must pass on every kept change:
  - `pnpm glossary` (no banned terms)
  - `pnpm lint` (zero oxlint errors)
  - `pnpm format:check` (zero formatting differences)
  - `pnpm test` (all 328 vitest tests pass)
  - `pnpm build` (TypeScript compiles with zero errors, Vite builds cleanly)
- No cheating: do not delay essential rendering behind arbitrary timers or fake loaders.
- No overfitting: changes must improve real-world web performance.

## What's Been Tried

- Baseline: 593.01 kb entry JS (193.10 kb gzip), 75ms mount time.
