# ADR 0005: Shot fit & focus — transform-based, non-destructive, hybrid pointer interaction

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Nam Pham

## Context

Screenshot Slots render Shots with `object-cover object-top`: the visible
region is whatever the slot's ratio happens to crop, and the user has no
control over it. Real uploads (16:9 game captures into the ~2.9:1 Detail
Slot) lose their content entirely. Issue #34 settles the replacement after
reviewing how the screenshot-beautification genre handles ratio mismatch
(Figma crop-drag, PostSpark Position Picker, Xnapper auto-background,
shots.so draggable rect): per-image fit mode plus manual reposition, with a
backdrop treatment so contained images never read as letterboxed.

## Decision

Each Shot carries two optional, additive fields:

- `fit?: 'cover' | 'contain'` — default `'cover'`.
- `focus?: { x: number; y: number }` — normalized 0..1, default
  `{ x: 0.5, y: 0 }`, which reproduces today's `object-top` output exactly.

The renderer positions the Shot with an explicit
`transform: translate(...) scale(...)` computed from fit + focus, not CSS
`object-fit`. `contain` fills the slot's leftover area with a blurred,
scaled copy of the same Shot. Pan gestures on the Canvas adjust `focus`
through a store action that coalesces undo steps on the shared 600ms window.
Pointer interaction is hybrid: drag-always on hover-capable pointers,
tap-to-select on touch so preview drags never hijack page scroll.

## Considered Options

- **Keep `object-fit` + expose `object-position`** — rejected: object-fit
  cannot zoom, and the drag math on top of cover-cropped images is the same
  transform work with less control; the transform model covers contain and
  cover under one mechanism.
- **Fit switcher only (Inspector segmented control, no pan)** — rejected:
  with fixed slot ratios, cover remains "zoom with no steering", the exact
  complaint; contain alone cannot choose a visible region for cover users.
- **Adaptive slots from Shot ratios (collage layout)** — deferred, not
  rejected: it changes layout algorithms and the Showcase contract; it does
  not give per-image control, which is the user's actual ask.
- **Chosen: additive fit/focus fields + transform renderer + hybrid
  pointer interaction** — smallest state diff that keeps ADR 0004's shape
  backward compatible, makes the visible region a first-class editable
  property, and stays WYSIWYG through Card Export (state → DOM → clone).

## Consequences

- Defaults must reproduce today's render exactly; existing saved states are
  visually unchanged until the user edits fit/focus.
- `html-to-image` export of CSS `filter: blur` is unproven in this
  codebase — the export smoke must verify it, with dominant-color
  extraction at ingest as the fallback backdrop.
- Drag-to-pan produces high-frequency updates: undo coalescing on the
  shared 600ms window is required, which also aligns the Annotation text
  action path with the Quote headline behavior.
- Touch drag must be opt-in per Shot (tap-to-select) with `touch-action`
  isolation, or it fights Bottom Sheet scroll in the Mobile Shell.
- Zoom (`scale` beyond cover) is deliberately absent; `focus` normalization
  leaves room to add it without another state migration.

## Amendment (same day, during T2 implementation)

The renderer does **not** use an explicit `transform: translate(...) scale(...)`.
Implementing it surfaced that the rejection of `object-fit` + `object-position`
was factually wrong: `object-position` reproduces Focus natively and
ratio-free (`0..1` → `0%..100%`, and the default `50% 0%` is literally
`object-top`), the Fit backdrop needs no math at all (a blurred `object-cover`
copy behind an `object-contain` image), and the transform path would have
required natural-size plus slot-size measurement for zero user-visible gain
while zoom stays deferred. The original transform decision remains the
upgrade path if the deferred zoom control ever ships; nothing else in this
ADR changes. Clamping is unaffected: the browser cannot pan past the image
edge under `object-position`, and `clampFocus`/`shotObjectPosition`
(src/lib/shot-fit.ts) still guarantee a normalized anchor.
