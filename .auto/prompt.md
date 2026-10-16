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

- Baseline (#1): 593.01 kb entry JS, 193.10 kb gzip, 71ms Chrome mount.
- Win #2: Lazy load html-to-image on demand for card exports (-11.08 kb entry JS, -3.87 kb gzip).
- Win #3: Lazy load OnboardingTour via React.lazy (-46.67 kb entry JS, -17.44 kb gzip).
- Win #4: Narrow App store subscription to ratio & cardType, and memoize Header (isolates root render cascade).
- Discard #5: Trim unused font weights in index.html (entry JS unchanged; keep in backlog).
- Discard #6: Set build.target to es2022 (no JS size delta).
- Crash #7: esbuild legalComments option not recognized in Vite ESBuildOptions.
- Discard #8: Memoize useInspectorTab & useCardUpdate (slight +0.06 kb hook boilerplate overhead).
- Win #9: Defer @vercel/analytics in main.tsx via React.lazy (-2.38 kb entry JS, -0.92 kb gzip).
- Win #10: Lazy load SheetDebugHud & replace 44kB cn package with clsx in tour (-2.77 kb entry JS, -25.14 kb total JS, -9.93 kb total gzip).
- Win #11: Disable legacy modulepreload polyfill in vite.config.ts (-0.52 kb entry JS, -0.22 kb gzip).
- Win #12: Lazy-load QRCodeSVG in CardPreview (-15.62 kb entry JS, -5.85 kb gzip, 61ms mount time).
- Win #12: Lazy-load QRCodeSVG in CardPreview (-15.62 kb entry JS, -5.85 kb gzip, 61ms mount time).
- Discard #13: Ref-based studio shortcuts handler (+0.20 kb entry JS).
- Win #14: Replace @base-ui/react/field in inspector-sections with native inputs (-8.91 kb entry JS, -3.29 kb gzip).
- Win #14: Replace @base-ui/react/field in inspector-sections with native inputs (-8.91 kb entry JS, -3.29 kb gzip).
- Win #15: Eliminate class-variance-authority in Button.tsx with zero-dependency mapping (-0.54 kb entry JS, -0.20 kb gzip).
- Win #15: Eliminate class-variance-authority in Button.tsx with zero-dependency mapping (-0.54 kb entry JS, -0.20 kb gzip).
- Discard #16: Remove default React namespace imports (+0.01 kb entry JS).
- Win #17: Simplify PresetsSection button classes & handler delegates (-0.25 kb entry JS, -0.08 kb gzip).
- Win #17: Simplify PresetsSection button classes & handler delegates (-0.25 kb entry JS, -0.08 kb gzip).
- Discard #18: Template literals instead of clsx in SwatchPicker/PresetCard (+0.01 kb entry JS).
- Win #19: Deduplicate theme swatch options array in StyleSection (-0.14 kb entry JS, -0.13 kb total JS).
- Win #19: Deduplicate theme swatch options array in StyleSection (-0.14 kb entry JS, -0.13 kb total JS).
- Discard #20: Direct getState() in Slot overlay buttons (+0.01 kb entry JS).
- Win #21: Map over ANNOTATION_SIDES constant in AnnotationsSection (-0.09 kb entry JS, -0.10 kb total JS).
- Win #21: Map over ANNOTATION_SIDES constant in AnnotationsSection (-0.09 kb entry JS, -0.10 kb total JS).
- Win #23: Direct string concatenation in buttonVariants & map CARD_TYPES in CardTypeSwitcherSection (-0.02 kb entry JS, -267 ms build).
- Win #23: Direct string concatenation in buttonVariants & map CARD_TYPES in CardTypeSwitcherSection (-0.02 kb entry JS, -267 ms build).
- Discard #24: Inline SVG path for ChevronDown in Header (+0.07 kb entry JS).
- Discard #25: Extract static section arrays in inspector-tabs (+0.03 kb entry JS).
- Discard #26: Imported useState and global parseInt in HeadlineSizeInput (entry JS unchanged).
- Win #27: Map over SHOT_FIT_OPTIONS in ScreenshotsSection (-0.04 kb entry JS, -0.04 kb total JS).
- Win #27: Map over SHOT_FIT_OPTIONS in ScreenshotsSection (-0.04 kb entry JS, -0.04 kb total JS).
- Win #28: Extract shared AuthorSignature components (-0.03 kb entry JS, -0.03 kb total JS, 56ms mount time).
- Win #28: Extract shared AuthorSignature components (-0.03 kb entry JS, -0.03 kb total JS, 56ms mount time).
- Discard #29: Split HeadlineSection into 4 useCardStore selectors (+0.04 kb entry JS).
- Win #30: Streamline onboarding status parsing & alias dismissWelcome (-0.09 kb entry JS, -0.09 kb total JS).
- Win #30: Streamline onboarding status parsing & alias dismissWelcome (-0.09 kb entry JS, -0.09 kb total JS).
- Win #31: Deduplicate logDebug prefix & simplify Inspector declaration (-0.02 kb entry JS, -0.01 kb total JS).
- Win #31: Deduplicate logDebug prefix & simplify Inspector declaration (-0.02 kb entry JS, -0.01 kb total JS).
- Discard #32: Named memo import in Header (+0.01 kb entry JS).
- Win #33: Function declarations over React.FC in inspector-sections (-0.03 kb entry JS, -175 ms build).
- Win #33: Function declarations over React.FC in inspector-sections (-0.03 kb entry JS, -175 ms build).
- Discard #34: Precompute ratio pixel string in RATIO_INFO (+0.12 kb entry JS).
- Discard #35: Derive isShowcase from card data (+0.06 kb entry JS).
- Win #36: Derive nameKey and descKey in STYLE_PRESETS dynamically (-0.09 kb entry JS, -0.10 kb total JS).
- Win #36: Derive nameKey and descKey in STYLE_PRESETS dynamically (-0.09 kb entry JS, -0.10 kb total JS).
- Win #37: Derive nameKey in PRESETS dynamically (-0.02 kb entry JS, -0.02 kb total JS).
- Win #37: Derive nameKey in PRESETS dynamically (-0.02 kb entry JS, -0.02 kb total JS).
- Discard #38: Use type imports in inspector-tabs (entry JS unchanged).
- Win #39: Eliminate redundant store subscriptions in AnnotationAddRow (-0.03 kb entry JS, -0.03 kb total JS).
- Win #39: Eliminate redundant store subscriptions in AnnotationAddRow (-0.03 kb entry JS, -0.03 kb total JS).
- Discard #40: Function declarations for LabeledValueRow & QrIconBox (+0.03 kb entry JS).
- Win #41: Positional arguments in buttonVariants (-0.03 kb entry JS, -0.03 kb total JS).
- Win #41: Positional arguments in buttonVariants (-0.03 kb entry JS, -0.03 kb total JS).
- Win #42: Eliminate clsx in Button.tsx & prune unused font weights in index.html (-0.02 kb entry JS, 58ms mount).
- Win #42: Eliminate clsx in Button.tsx & prune unused font weights in index.html (-0.02 kb entry JS, 58ms mount).
- Discard #43: Type imports in PresetCard, SegmentedControl, tabs (entry JS unchanged).
- Win #44: Eliminate redundant invariant qrBg across CARD_THEME_STYLES (-0.07 kb entry JS, -0.06 kb total JS).
- Win #44: Eliminate redundant invariant qrBg across CARD_THEME_STYLES (-0.07 kb entry JS, -0.06 kb total JS).
- Win #45: Inline buttonVariants directly in Button component (-0.04 kb entry JS, -0.05 kb total JS).
- Win #45: Inline buttonVariants directly in Button component (-0.04 kb entry JS, -0.05 kb total JS).
- Win #46: Streamline useFlash timer cleanup & type-only ButtonHTMLAttributes (-0.03 kb entry JS).
- Win #47: Defer sonner out of entry via lazy Toaster + toast proxy (-40.25 kb entry JS, -11.2 kb gzip, 57ms mount).
- Win #47: Defer sonner out of entry via lazy Toaster + toast proxy (-40.25 kb entry JS, -11.2 kb gzip, 57ms mount).
- Win #48: Native range input replaces base-ui Slider stack (-15.91 kb entry JS, -5.76 kb gzip, +0.21 kb CSS).
- Win #48: Native range input replaces base-ui Slider stack (-15.91 kb entry JS, -5.76 kb gzip, +0.21 kb CSS).
- Win #49: Native checkbox replaces base-ui CheckboxRoot stack (-4.19 kb entry JS, -1.24 kb gzip, +0.16 kb CSS).
- Win #49: Native checkbox replaces base-ui CheckboxRoot stack (-4.19 kb entry JS, -1.24 kb gzip, +0.16 kb CSS).
- Win #50: Native switch replaces base-ui SwitchRoot stack (-2.00 kb entry JS, -0.64 kb gzip, 55ms mount best).
- Win #50: Native switch replaces base-ui SwitchRoot stack (-2.00 kb entry JS, -0.64 kb gzip, 55ms mount best).
- Win #51: Native radios replace base-ui radio stack in SegmentedControl+SwatchPicker (-16.21 kb entry JS, -6.20 kb gzip).
- Win #51: Native radios replace base-ui radio stack in SegmentedControl+SwatchPicker (-16.21 kb entry JS, -6.20 kb gzip).
- Win #52: Extract shared Hint caption component in inspector-sections (-0.27 kb entry JS).
- Win #52: Extract shared Hint caption component in inspector-sections (-0.27 kb entry JS).
- Win #53: Extract shared HistoryButton in Header undo/redo (-0.13 kb entry JS).
- Win #53: Extract shared HistoryButton in Header undo/redo (-0.13 kb entry JS).
- Win #54: Demo shot becomes a public asset instead of inline base64 (-5.00 kb entry JS, -3.20 kb gzip).
- Win #54: Demo shot becomes a public asset instead of inline base64 (-5.00 kb entry JS, -3.20 kb gzip).
- Win #55: Verification rerun — #54 reproduces exactly (419.57 kb); plateau confirmed real.
- Win #55: Verification rerun — #54 reproduces exactly (419.57 kb); plateau confirmed real.
- Win #56: Extract shared Stack component in inspector-sections (-0.22 kb entry JS).
- Win #56: Extract shared Stack component in inspector-sections (-0.22 kb entry JS).
- Win #57: Extract shared Code helper in i18n posting_tips (-0.14 kb entry JS).
