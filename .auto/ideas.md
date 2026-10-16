# Performance Optimization Ideas Backlog

All original backlog leads have been tried (see .auto/log.jsonl runs #1–#63).
Entry JS is at its honest floor of **419.21 kB** — proven byte-deterministic over
6 consecutive verification runs, with exhaustive negative audits (zero duplicate
literals, zero dead exports, zero cross-chunk duplication, zero inline payloads).

## Remaining levers — all require a design decision (Jesse's call, not agent's)

- **CSS-only tooltips** (~7 kB raw / ~18.7 kB rendered): replace the base-ui
  tooltip family with CSS hover/focus tooltips. Blocked by UX-polish decision;
  deferral is proven contract-dead (Tooltip.test asserts sync focus → label).
- **i18n dictionary split** (~7 kB raw): lazy-load the inactive locale.
  Blocked by the sync `useUiCopy` dictionary contract; language-switch tests
  assert English text synchronously after `setLanguage('en')`.
- **Toaster fetch-on-first-toast** (real-world win, not measurable on
  entry_js_kb): mount the lazy Toaster only when the first toast fires, so
  sonner (33.5 kB post-paint chunk) is not fetched for visitors who never
  export. Primary metric wouldn't move, so it can't be "kept" in this loop;
  recorded here as a candidate improvement outside the metric.
- **WelcomeCard dialog replacement** (~9 kB raw): replace base-ui Dialog with a
  custom overlay. Rejected by agent judgment: hand-rolling dialog a11y (focus
  trap, aria-modal, scroll lock, return-focus) trades correctness risk for
  bytes; the library is doing its job.

## Build-config findings (closed)

- `build.target: 'es2022'`: identical output (#6).
- `modulePreload.polyfill: false`: win, -0.52 kB (#11).
- `minify: 'terser'`: +0.74 kB entry and 2× build time — the rolldown oxc
  minifier strictly beats terser 5.51 here (#63).
