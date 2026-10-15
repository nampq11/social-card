# One-Screen Studio: viewport-locked shell on all devices

Users rejected the scrolling page: the studio must fit the viewport everywhere — page never scrolls, only nested panels do. Desktop (≥1024px) uses a sidebar arrangement (Header on top, Inspector left with internal scroll, Canvas filling the rest); below 1024px the same control groups re-host in a standard non-modal Bottom Sheet driven by a bottom toolbar, with the Canvas fit-to-view between Header and sheet. This mirrors the proven pattern of Canva / Figma mobile / GoDaddy Studio / IG Stories.

## Considered Options

- Scrollable page (the old layout) — rejected: content grew past the viewport on any laptop; the card desk had a hard `min-h` and the tips box sat below the fold.
- A third tablet-hybrid layout (Inspector as slide-over drawer) — rejected: one seam (`lg`) keeps exactly two arrangements to test and maintain.
- Modal sheets for mobile controls — rejected: NN/g guidance says don't hide the editing artifact; the canvas must keep live-updating behind controls.

## Consequences

- Fit-to-View is the default Canvas scale everywhere; desktop keeps a manual zoom override that sticks until Fit is re-selected, and any viewport/container resize re-fits while in Fit mode.
- Mobile is fit-only: no zoom UI, no pinch-zoom (YAGNI for now).
- The shell uses dynamic viewport height so browser chrome and the virtual keyboard shrink the canvas (which refits) rather than producing page scroll.
- The posting-tips box moves into an info popover on the canvas toolbar so it stops consuming viewport height.

- The Inspector itself never scrolls either (research-backed, Oct 2026): its
  sections are grouped behind tabs from one shared registry
  (`inspector-tabs.tsx`) that both the desktop Inspector and the Mobile Sheet
  render — same grouping everywhere, only the container differs (Canva's
  tab-panel convention; W3C APG's accordion scroll-reduction; NN/g in-page
  tabs). Each tab fits a laptop-height panel (verified at 1366×768).
  `overflow-y-auto` remains only as a degradation floor for unrealistically
  short windows. Style Presets exist to keep cross-group work cheap: resting
  a style is one click from any tab, so tab separation doesn't tax the
  workflow (NN/g's cross-tab-comparison caveat).

## Addendum: fluid bottom sheet (Oct 2026)

The Mobile Sheet moved from a tap-toggled, CSS-height transition to a
drag-driven sheet following Apple's _Designing Fluid Interfaces_: 1:1
pointer tracking with rubber-banded edges, momentum projection picks the
resting point on release, and a critically damped spring carries the
release velocity (`lib/sheet-drag.ts`, `lib/use-sheet-drag.ts`). The
transform-only animation writes the canvas's bottom padding directly every
frame (not through an inherited CSS variable, which would recalculate the
whole document's styles per frame) — combined with content-box
Fit-to-View, the card refits continuously and stays fully visible at
every sheet position instead of hiding behind the expanded sheet.
The sheet's surface is near-opaque (`--color-sheet`), not
backdrop-filtered glass: WebKit re-samples an element's backdrop every
frame it moves, and the per-frame reserve changes the content behind the
sheet, so a blurred fixed sheet flickered while dragging on iOS (#49).
The never-moving glass panels (header, zoom HUD, Inspector) keep their
blur.
Expanded height stays 58dvh but is clamped to leave the canvas a visible
floor (portrait phones); landscape falls back to a minimum working
height, the card refitting into the narrow strip that remains.

## Addendum: sheet anchoring (Oct 2026)

The sheet wrapper anchors `absolute` to the app root (which is
`relative`), not `fixed` to the viewport. On iOS 18 Safari, dragging the
sheet up made it stutter and pin to the top of the screen with the page
rubber-banding — while the identical bundle stayed correct on iOS 26
and every locally driven engine (tap and drag verified frame-by-frame in
WebKit). The pinned geometry is unreachable through the drag module's
own math (expanded height is clamped to `innerHeight − 260`, so no
viewport value it can read lets the sheet reach the screen's top), which
locates the defect in the fixed-positioning path itself: the WebKit
297779 bug family, where the compositor displaces fixed-anchored bottom
elements during toolbar transitions. Re-anchoring to the root's box puts
the sheet in the one coordinate system the shell's header and canvas
already share — if the engine mis-sizes the dynamic viewport, everything
is wrong together instead of the sheet tearing loose on its own.

On-device follow-up: the ghost persisted after the re-anchor — an
on-device frame shows the expanded sheet floating mid-screen with the
dot grid below it, a state no legal offset of the absolute-anchored DOM
can produce. The remaining engine-sensitive construct was layer
promotion: `will-change: transform` hands the sheet to the compositor,
and iOS 18's compositor displaces composited layers at stale offsets
around gestures (the sheet ghost-replayed its dragged position). The
promotion had also stopped buying anything: every drag frame already
does main-thread work (the per-frame canvas reserve write), so the
transform never rode the compositor alone. The sheet is deliberately
NOT `will-change` — it paints in document order, in sync with layout,
on every engine.
