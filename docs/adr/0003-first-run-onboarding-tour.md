# ADR 0003: First-run onboarding — opt-in spotlight tour on vendored Dice UI Tour

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Nam Pham

## Context

New visitors land directly in the One-Screen Studio with no guidance. We want a
first-run onboarding that reaches the first useful action (edit a card, export
it) without repeating the failures documented for onboarding UX:

- Auto-fired tours are "push revelations": dismissed by 60–80% of users within
  three steps, ~23% completion; user-triggered tours complete 2–3× better
  (NN/g; Chameleon 2025 benchmarks).
- Effective tours cap at ~5 steps with ≤25 words each, show progress, and are
  always skippable; refreshing must never restart onboarding (progress
  persists); the tour must stay recallable later from the UI.
- A blank canvas contraindicates tours — not our case: the studio opens with a
  preset-filled card, so a tour has something live to point at.

Library research (Oct 2026) compared driver.js, react-joyride v3, shepherd.js,
intro.js, radix-tour, and Dice UI's Base UI Tour. shepherd.js and intro.js are
AGPL/commercial-dual. driver.js and react-joyride ship their own popover UI,
which would fight the studio's frosted-glass design system. Dice UI's Tour is
a headless, composable spotlight tour built on the same `@base-ui/react`
primitives this studio standardized on (ADR 0001), MIT-licensed, and installed
the shadcn way: the component source is vendored into the repo.

Placement constraint discovered while building: the studio's regions (Canvas,
Inspector, Bottom Sheet) are viewport-sized by design (ADR 0002). floating-ui
deliberately corrects only the cross axis in `shift` (`crossAxis: false`);
the placement axis belongs to `flip`. A viewport-tall anchor therefore has no
side with room, and the popover clips off-screen regardless of middleware
tuning — verified at 1440/800/390 widths.

## Decision

1. **Vendored Dice UI Tour** (`src/components/ui/tour.tsx`) is the tour
   engine. Local adaptations stay minimal for future re-syncs: our Button,
   lucide icons instead of the registry icon placeholder, our `secondary`
   button variant, and `shift` corrects both axes (see decision 4). The one
   vendored English label (icon-only TourClose) is overridden at the call
   site with the i18n dictionary — visible text is the accessible name
   everywhere else.
2. **Opt-in flow**: a first-visit welcome Dialog offers the tour or an
   explicit skip; the tour never auto-starts. Either choice persists
   `social-card.onboarding = "done"` in localStorage — refreshing never
   restarts onboarding. Replay lives in the Tips popover (easy to dismiss,
   easy to recall).
3. **Four steps, ≤25 words each**, progress counter, Skip + Esc everywhere.
4. **Anchors are the surfaces each step talks about**: the rendered card
   (`#social-card-node`), the Inspector panel / Bottom Sheet
   (`data-tour="inspector"`), the shared tab bar
   (`data-tour="inspector-tabs"`), and the Header export group
   (`data-tour="export"`). Each selector resolves to the same semantic
   surface in both Shells, so one step set serves desktop and mobile.
   Because these surfaces are viewport-sized (ADR 0002), floating-ui's
   default cross-axis-only `shift` leaves the popover clipped off-screen; the
   vendored component corrects both axes so the popover floats over the
   dimmed target (coach-mark convention) while `limitShift` keeps it
   anchored. Verified fully in-viewport at 1440×813, 800×513, 390×757.

## Consequences

- The tour is a pure UI-layer feature: it never touches Card State.
- Tour copy flows through the i18n dictionary (`tour_*`, `onboarding_*` keys)
  and is translated in both Interface Languages.
- `src/components/ui/tour.tsx` is excluded from oxlint (`ignorePatterns`) as
  vendored third-party code; re-syncing means re-applying the five documented
  adaptations.
- With both-axis shift, a popover may overlap its dimmed target when no side
  has room — accepted coach-mark behavior; `limitShift` prevents it from
  drifting off its anchor.
