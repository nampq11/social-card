# ADR 0009: Third Card Type (Definition) — additive nest and generalized seams

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Nam Pham

## Context

ADR 0004 introduced the Card Type discriminator with one optional nest
(`showcase`) and closed with: "If a third Card Type ever arrives,
symmetrize: nest each type's content (or graduate to the union) — the
single nested seam makes that move local instead of global." Issue #63
arrives: a Definition Card whose content (term, phonetic, observation,
punchline, background photo, scrim darkness) has no place in the Quote
shape.

## Decision

Add a second optional nest, `definition?: DefinitionContent`, to the same
flat `CardState` — and generalize only the seams that already branch on
`cardType`:

- `CARD_BODIES: Record<CardType, React.FC<{ card: CardState }>>` — the
  Card Preview's body branch became a render map keyed by type. Adding a
  type without registering a body is a compile error, so exhaustiveness
  no longer depends on a reviewer catching a missed ternary.
- `CARD_TYPE_CAPABILITIES: Record<CardType, CardTypeCapabilities>` — the
  scattered `isShowcase` boolean and the App's ratio gates became one
  record of per-type control visibility (ratio selectable, theme
  selectable, headline controls, style presets).
- `patchDefinition` in the store — mirrors `patchCard`'s undo rhythm
  through the nest with `definition:${field}` coalesce keys: one typing
  burst per field and one scrim drag each fold into a single undo step,
  and different fields never merge.

Quote content stays flat. The quote-nest symmetrization ADR 0004
anticipated stays deferred until a forcing function that pays for it
(a fourth type, or a Quote-only field that must round-trip through a
union).

## Considered Options

- **Symmetrize now** (move headline/sublines/QR into a `quote?` nest) —
  rejected: a typing ripple through every existing Quote touchpoint —
  the store, both Preset systems, every Inspector section, and most
  tests — with zero user-visible value. This is the exact cost ADR 0004
  rejected the discriminated union for; deferral was conditional on
  value, and a third type does not create any.
- **Graduate to the discriminated union** — rejected: same ripple, same
  zero value; the representable-illegal-state mitigation (render map
  keys on `cardType` before touching any nest; `switchCardType` is a
  dedicated atomic action) already holds for a second nest.
- **Chosen: additive nest plus generalized branch seams** — the diff
  stays local while the two Records make the _next_ type local too.

## Consequences

- Definition content round-trips non-destructively through type switches,
  exactly like Showcase content, through the same `switchCardType`
  action (its non-destructive semantics unchanged; the Showcase ratio pin
  now reads the capability record instead of a hardcoded type name).
- Illegal states remain representable (a populated `definition` nest
  while `cardType === 'quote'`); the ADR 0004 double mitigation carries
  over unchanged.
- The next Card Type plugs into three compile-exhaustive Records —
  `CARD_TYPE_CAPABILITIES`, `CARD_BODIES`, and `CONTENT_SECTIONS` (the
  Inspector's per-type section list) — where the TypeScript checker walks
  the author through the list. The switcher's `CARD_TYPES` option array is
  derived from the capability record's keys, so it cannot silently omit a
  registered type; its label test pins the copy, not the presence.
- Definition selects no theme: the background photo replaces it, so the
  theme controls hide (`themeSelectable: false`). Ratio stays selectable
  (`ratioSelectable: true`): the three-tier layout is ratio-agnostic,
  the reference Preset brings 4:5, and hidden controls that lie about
  state are worse than visible ones that tell the truth. Pinning remains
  a one-line change if field use proves otherwise.
- Export safety carries the bd565a8 lesson forward: background photos
  live in Card State as data URLs, and the bundled demo background ships
  as a hashed build-time asset — never a runtime `public/` URL string.
