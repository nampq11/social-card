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
Expanded height stays 58dvh but is clamped to leave the canvas a visible
floor (portrait phones); landscape falls back to a minimum working
height, the card refitting into the narrow strip that remains.
