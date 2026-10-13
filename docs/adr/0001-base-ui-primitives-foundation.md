# ADR 0001: base-ui as the UI primitives foundation

- **Status:** Accepted
- **Date:** 2026-02-13
- **Deciders:** Nam Pham

## Context

The studio's interface doesn't feel like one product: buttons, controls and panels
in different areas look and behave slightly differently, and the interaction logic
is written by hand. The segmented control has no radio-group semantics, no
arrow-key navigation, and no tests. Every hand-rolled focus, keyboard and ARIA
behavior carries edge-case risk that battle-tested libraries already solve.

We are converging all UI onto a small shared primitives layer (typed variants via
cva + clsx, Button first). Before the first interactive primitive lands, we need to
decide where the accessible behavior comes from: build it by hand, adopt a
component library, or adopt headless primitives and own the styling.

This decision is hard to reverse: components will be built on top of the primitive
layer, and every later component inherits its semantics and API style. It is also
surprising without context — "why not shadcn/ui?" is the default question for a
React + Tailwind project.

## Decision

We adopt **base-ui (`@base-ui/react`)** as the headless-primitives foundation for
the studio's shared UI layer. Accessibility, focus management and keyboard
interaction come from the library; visual styling stays ours, expressed as typed
variants (cva + clsx) in our own components.

Facts this rests on:

- base-ui is developed by the team behind Material UI, with lineage from Radix and
  Floating UI; it reached v1.0 stable in December 2025 and tracks current React
  (19) semantics natively — no legacy compatibility weight.
- It is a single package with headless components (segmented controls / toggle
  groups, dialogs, menus) and a `render` prop composition model.

## Trade-offs accepted

- **We own all styling.** base-ui is unstyled by design: every visual state
  (hover, focus-visible, active, disabled, checked) must be designed and
  implemented by us. The cva variant layer is the counterpart of this decision,
  not a substitute for it.
- **Younger ecosystem.** Fewer community examples, plugins and answered questions
  than Radix. Edge cases may require reading the library source.
- **API lock-in.** Components across the studio will be written against base-ui's
  `render`-prop APIs. If base-ui is ever abandoned, migrating to another headless
  library is a real (though bounded) refactor, because semantics are preserved but
  call sites change.

## Rejected alternatives

- **shadcn/ui** — it is not a dependency but copied component source pasted into
  the repo. Its convergence story is the opposite of what this refactor needs:
  every paste can drift, and "upgrading" means re-running a CLI over our edited
  copies. We want one primitives layer we own, not a second source of hand-edited
  component code. (shadcn/ui would also quietly choose the primitive layer for us.)
- **Radix Primitives** — the incumbent and a close second. Rejected because it is
  split across many packages, carries pre-React-19 API history (`asChild`),
  development has slowed relative to base-ui, and base-ui offers the same
  accessibility guarantees with a modern API from an actively shipping team.
  Radix remains a viable fallback if base-ui hits a blocker.
- **Hand-rolled primitives** — the status quo that motivated this refactor. Focus
  management, roving tabindex and ARIA semantics are exactly the edge-case-prone
  code we want to stop maintaining.

## Consequences

- The shared primitives layer (Button now, segmented controls next, dialogs and
  menus later) builds on base-ui components styled by our cva variants.
- New interactive components must not hand-roll focus/keyboard/ARIA behavior when
  a base-ui primitive covers it.
- If a needed behavior is missing from base-ui, we extend it rather than fork it;
  if base-ui cannot cover a case at all, that is the trigger to reopen this ADR.
