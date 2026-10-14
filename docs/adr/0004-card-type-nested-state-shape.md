# ADR 0004: Card Type discrimination — shared-flat Card State with nested type content

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Nam Pham

## Context

`CardState` is a flat, Quote-only model, and everything is built on that
flatness: the store patches `Partial<CardState>`, content Presets fill
`Partial<CardState>`, Style Presets `Pick` from it, and every Inspector
section reads it. Issue #33 introduces a second Card Type (Showcase) whose
content — screenshots and annotations — has no place in the Quote shape.
The default review question is "make it a discriminated union."

## Decision

One `cardType: 'quote' | 'showcase'` field on the flat `CardState`, plus a
single optional nested `showcase` object holding all Showcase-only content
(shots and annotations). Shared fields (author identity, theme, ratio) and
all Quote fields stay exactly where they are.

## Considered Options

- **Full discriminated union** (`CardState = QuoteCard | ShowcaseCard`) —
  rejected: illegal states would be unrepresentable, but the cost is a
  typing ripple through the store's patch/undo machinery, both Preset
  systems, every Inspector section, and most existing tests, with zero
  user-visible value.
- **Flat-additive fields** (`screenshots`, `annotations` directly on
  `CardState`) — rejected: no boundary between type contents; Quote cards
  would permanently carry Showcase fields.
- **Chosen: discriminator + nested type content** — smallest diff that
  still gives each type's content one seam.

## Consequences

- Illegal states are representable (a populated `showcase` nest while
  `cardType === 'quote'`). Mitigated twice over: the Card Preview branches
  on `cardType` before touching the nest, and the type switch is a
  dedicated atomic store action that never coalesces into neighboring undo
  steps.
- Quote rendering and all existing touchpoints keep working unchanged.
- If a third Card Type ever arrives, symmetrize: nest each type's content
  (or graduate to the union) — the single nested seam makes that move
  local instead of global.
