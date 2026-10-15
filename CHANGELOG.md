# Changelog

## Unreleased

## 0.1.0 (2026-10-15)

First tagged release of the social-card studio — a bilingual (VI/EN) card designer with export. Everything below covers work since the first commit.

### Features

- Added the Showcase card type with non-destructive switching: quote → showcase → quote round-trips preserve content, shots ingest in upload order capped at three, the Content tab becomes Screenshots, and the card renders a hero-plus-details collage with a centered author footer. #33
- Added Inspector annotations: text renders inside its shot's slot with side-aware margin placement, a preset curve at the slot-facing end, Patrick Hand ink styling, and per-Shot caps with delete and Showcase style degradation. #33
- Added per-shot Fill/Fit modes and draggable Focus with on-canvas pan. #34
- Added Shot fit v2: auto-fit rendering, zoom transforms, fluid physics pan (rubber-banding, momentum, critically damped spring settle with velocity handoff), pinch-anchored and double-click zoom, ctrl+wheel zoom anchored at the cursor, and an on-shot pill with a 3-state Inspector. #38
- Added a shot-gestures onboarding tour that fires once at the first Shot and can be recalled from Tips. #38
- Merged onboarding into one tour: the Showcase gesture steps join the four basics steps while a Shot exists, nothing auto-opens the tour mid-task, and Tips carries the single replay entry. #38
- Shipped the factory card as a Showcase holding a bundled demo Shot, so the studio opens on a filled collage and the first-run tour always walks all six steps (ADR 0003 amendment). #38
- Redesigned the studio UI following Apple HIG, with mobile-responsive layouts. #20
- Added a first-run welcome card and an opt-in 4-step spotlight tour. #19
- Built a one-screen, viewport-locked studio shell for desktop and mobile. #17
- Rebuilt the UI on a zustand card store, base-ui primitives, and Sonner toasts. #16
- Added full bilingual VI/EN UI copy: a copy dictionary routed through every component, per-language platform descriptions, and a persisted Interface Language toggle in the header. #2 #3 #5
- Added card export as a `useCardExport` module with real-device mobile UI fixes. #21
- Made the quote card a 1:1 replica of the reference design (spec #24). #31
- Replaced the Vite-scaffold favicon with the product's real card-glyph logo and cache-busted its URL so returning visitors drop the old bolt. #36 #37

### Fixes

- Made one zoom gesture a single undo step, and a click without drag now selects cover shots on desktop. #38
- Stopped the replayed tour from flash-closing to the Tips trigger's restored focus: the popover vetoes that one focus return. #38
- Re-keyed the Tour when its step set flips, fixing steps that never rendered after late-mounted steps re-registered out of order under React StrictMode. #38
- Re-derived natural dimensions when a slot's `dataUrl` swaps to a cached image, fixing stale shot geometry. #38
- Cancelled the settle glide when external focus writes land, so focus edits and gestures no longer fight. #38
- Dropped the slot's decorative ring in Showcase so contain-fit shots no longer frame as an empty box.
- Hid every ratio surface in Showcase and stopped thumbnail delete from bubbling.
- Coalesced annotation typing into one undo step instead of one per keystroke.
- Folded diacritics and hardened download filename slugs on export. #22
- Rejected oversized avatar uploads and surfaced avatar upload failures instead of failing silently. #7
- Stopped status toasts from cancelling each other. #7
- Associated Inspector labels with their inputs for accessibility, translated preset names, and stored headline content in sentence case. #7
- Applied UI review fixes: touch ergonomics, focus rings, and a fluid bottom sheet. #18
- Elevated animation craft — replaced keyframes and eliminated layout transitions. #8
- Hardened `CardPreview` canvas isolation and Inspector controls. #10
- Restored the Be Vietnam Pro-first card font stack. #4
- Added an explicit 307 redirect from `/` to `/social-card` and fixed trailing-slash routing.
- Memoized the preview Slot so a focus write re-renders one shot instead of the whole collage.
