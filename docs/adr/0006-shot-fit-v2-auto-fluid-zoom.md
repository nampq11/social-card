# ADR 0006: Shot fit v2 — auto-fit default, on-shot controls, fluid pan physics, zoom

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Nam Pham
- **Supersedes:** the default-fit decision and interaction bar of ADR 0005 (fit/focus
  state shape, clamp contract, and the export-blur verification carry forward)

## Context

ADR 0005 shipped per-shot Fit/Focus, but the review against real usage found three
compounding failures (issue #38):

1. **Ratio.** Slots have fixed ratios (Hero ≈ 1.25, Detail band ≈ 2.9) and screenshots
   never match them (16:9, 9:19.5). The default `cover` crop cuts 30–60% of the content
   the moment it lands; `contain` shows everything but small, with large empty blur
   bands. The category (Xnapper, shots.so, Pika, CleanShot X — verified against primary
   sources, issue #38) rejected crop-by-default years ago: everyone contains the shot on
   a padded canvas with an auto background, automation-first, manual as a thin layer.
2. **Discovery.** Rescuing an image took three buried Inspector steps; the canvas itself
   had no affordance beyond a cursor.
3. **Feel.** Pan hard-clamps at edges (WWDC18 803: without rubber-banding an edge "feels
   like you hit a wall"), has no momentum, no settle, and no zoom — cover cropping stays
   "blind zoom, no steering".

The user asked for the replacement to follow Apple's interaction principles.

## Decision

### 1. Auto-fit replaces the fixed cover default

With no user override, a Shot's Fit is **derived at render time** from the shot ratio vs
the slot ratio: within ~20% (log-ratio) → cover; otherwise → contain. An explicit
`fit` value always wins and is the user's override; the Inspector switcher gains
"Tự động" (the absence that clears the override). Rationale: auto must react to slot
placement and reordering for free, which an ingest-time decision cannot (the same image
may suit the Hero and need contain in the Detail band). Zero new state; the override
field is exactly ADR 0005's.

**This deliberately changes the default render of existing saved states** whose shots
mismatch their slot — that default render is the bug being fixed. States with explicit
`fit` values are untouched; absent-field shots that happen to match their slot render
identically to before.

### 2. On-shot controls, anchored to their source

Selecting a Shot (tap on desktop, arm on touch) surfaces a floating pill on the slot
itself: fit toggle (Đầy khung/Trọn ảnh) · Đặt lại · Xong. This is Apple's reactive-
affordance pattern (Photos shows Crop only while a pinch suggests it) and ADR-grade
spatial consistency: controls appear where the content is. The pill is
export-excluded like the existing selection chrome; the Inspector stays in sync as the
full-control surface.

### 3. Fluid pan physics (WWDC18 803 floor)

- **Rubber-banding** at both axes' edges during overdrag, progressive resistance
  (`(x·dim·c)/(dim + c·|x|)`, c = 0.55); on release, spring back inside.
- **Momentum projection** on release: project the coast distance from release velocity
  (`v/1000 · r/(1−r)`, r = 0.998), pick the nearest valid end from the projection,
  settle with a critically damped spring (damping 1.0, response 0.3) — no overshoot on
  clamp settles.
- **Reduced motion**: `prefers-reduced-motion` skips glide and rubber-band springs —
  positions jump to the clamped target (feedback survives, vestibular motion does not).
- Focus values keep their 0..1 domain at every zoom level; the physics live on the same
  focus values the store already coalesces (600ms window).

### 4. Zoom — the transform upgrade path, exercised

Additive `Shot.scale?: number` (absent = 1, clamped 1..4), cover-only. The renderer
applies `transform: scale(s)` with `transform-origin` at the focus anchor — exactly the
upgrade path ADR 0005 deferred; at scale = 1 no transform is emitted and the render is
byte-identical to today. Because object-position percentages align the content's anchor
fraction with the box's anchor fraction, pan stays 1:1 at every zoom (overflow grows
with s) and zooming keeps the anchored content point stationary.

Gestures, chosen to avoid WWDC's double-tap latency trap on touch:

- **Touch**: two-finger pinch anchored at the midpoint (the content point under the
  fingers stays under them; midpoint travel pans). No double-tap — single-tap arming
  must not pay a ~500ms disambiguation delay.
- **Desktop**: ctrl+wheel anchored at the cursor, and double-click toggling 1 ↔ 2 at
  the click point.
- Pinch/wheel writes go through `setShotScale` on the shared 600ms coalesce window
  (one pinch, one undo); zoom is inactive for contain Shots — the fit toggle is the
  mode change.

## Considered Options

- **Ingest-time auto-fit** (store `fit` at upload from the hero ratio) — rejected:
  can't see slot placement or reordering; a Detail-band shot cleared by a Hero-ratio
  test is worse than no auto-fit.
- **Contain default unconditionally** — rejected: changes the card's visual identity
  even where cover already fits; auto-by-ratio rescues exactly the broken cases.
- **Pinch-only zoom on touch plus double-tap toggle** — rejected: double-tap detection
  delays single-tap arming (WWDC-documented cost) on the primary touch flow.
- **Animation library (Motion) for the springs** — not needed: one critically damped
  spring plus a projection function is ~40 testable lines; a dependency for that is
  dead weight (YAGNI).
- **Chosen: the four decisions above** — each is additive state or pure function over
  existing state; every default render change is the bug being fixed.

## Consequences

- The export smoke keeps verifying blur survival; it now also verifies zoomed exports
  pixel-wise (transform survives html-to-image).
- Long momentum glides can cross a coalesce-window boundary and split into two undo
  steps — accepted; a glide is one perceptual action but the window is time-boxed.
- The Detail band's large blur bands with contained wide shots are a known aesthetic
  cost of showing the whole screenshot; zoom (on cover) and future adaptive slots
  (ADR 0005 deferred option) are the escape hatches.
- Renderer now emits a transform for scale ≠ 1; the blur backdrop, ring, and window
  card presentation of contain are unchanged from ADR 0005.
