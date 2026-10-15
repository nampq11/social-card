# ADR 0007: Design token vocabulary, OS-following dark mode, and the card-static invariant

- **Status:** Accepted
- **Date:** 2026-10-15
- **Deciders:** Nam Pham
- **Related:** ADR 0001 (base-ui primitives foundation — this completes its primitives layer)

## Context

The app drifted into per-component literals: the same ink blue-gray appeared as
`#1d1d1f`, `text-neutral-800`, and `text-zinc-800` on different screens; two accent
blues (`#0071e3`, `blue-500`) and two brand gradients (`#4F75FF→#2554E8` built two
ways) competed; the Inspector rebuilt Checkbox, Switch, Slider, Select, and Tooltip
skins inline per call site. Worse, three hand-written dark-mode CSS blocks were dead:
they targeted a `.dark` class nothing ever applied, while `dark:` utilities follow the
OS — so on OS dark the app rendered light-on-light glass panels (issue #45).

The question "should we move to shadcn/ui?" was answered by ADR 0001 and re-confirmed:
the stack is already shadcn-adjacent (Tailwind v4 + cva/clsx + base-ui); the problem
was tokens, not components.

## Decision

### 1. Codify current values — tokens describe the app, the app is not redesigned

`src/index.css` owns a flat Tailwind v4 `@theme` vocabulary. Source of truth is what
the app shipped before this ADR; the only unifications are true duplicates:

- two accent blues → `--color-accent` (`#0071e3`) + `--color-accent-hover`
- two hand-built brand gradients → `--color-brand-from` / `--color-brand-to`
- the sheet pair `#1C1C1E` / `#1E1E22` → one `--color-sheet` (tour card and welcome
  popup now share it)

**Adaptive chrome — override-flipping** (light value in `@theme`, dark value in the
override block below): `ink`, `ink-secondary`, `ink-tertiary`, `ink-muted`, `ink-faint`,
`surface`, `surface-raised`, `sheet`, `accent`, `link`, `hairline` (the chrome border on
fields, popups, and groups), `canvas` + `canvas-dot` (the Freeform dot-texture surface),
`glass` (the vibrancy fill behind the Header and zoom HUD).

**Adaptive chrome — mode-constant** (defined in `@theme` only; they had no dark variant
before this ADR and codification kept it that way): `accent-hover`, `green`,
`brand-from`, `brand-to`. Adding a dark value to one of these is a design change, not
a token chore — do it deliberately, not while "completing" the override block.

**Card-static** (never in the override block, see §3): `card-white-ink`,
`card-white-muted`, `card-paper`, `card-paper-ink`, `card-paper-muted`, `card-dark`,
`card-dark-ink`, `card-dark-muted`, `card-mist`, `card-mist-ink`, `card-mist-muted`.

### 2. Dark mode: OS-following, no toggle, via an unlayered media-query override

Tailwind v4 emits `@theme` variables on `:root` inside `@layer theme`. The dark
palette is a second `:root` block inside `@media (prefers-color-scheme: dark)` at the
**top level (unlayered)** — unlayered styles beat all layers in the cascade, so the
override wins without touching the theme block. Utilities hold live `var()` references
(e.g. `bg-surface` compiles to `background-color: var(--color-surface)`), so every
utility flips when the variable does; opacity modifiers compile to `color-mix` on the
variable and also re-resolve. `@theme inline` is not needed — it exists for variables
referencing other variables, and these are literals.

`dark:` utilities and hand-written `@media` rules now agree because both follow the OS.
There is deliberately no manual toggle.

### 3. The card-static invariant: export must not depend on the viewer's OS

The exported PNG is a product artifact; a card authored on a machine in OS dark must
export identically to one authored in OS light. Therefore:

- `card-*` tokens appear **only** in `@theme`, never in the dark override block.
- Guard rails: `src/constants/card-theme.test.ts` fails if any `CARD_THEME_STYLES`
  value contains `dark:`; `scripts/smoke-theme.mjs` (CDP
  `Emulation.setEmulatedMedia`) asserts chrome colors flip while the card's computed
  colors do not, then restore.
- Export safety mechanics: html-to-image clones **computed** styles — CSS variables are
  resolved to literals before cloning, so a card subtree cannot inherit a flipped
  chrome variable it doesn't reference.

### 4. Primitives layer complete (ADR 0001)

`src/components/ui/` now holds Button, Checkbox, Switch, Slider, Select, Tooltip,
FieldLabel, SegmentedControl — base-ui for behavior, cva/clsx + tokens for skin.
Notable choices: **Select is native** (tiny option lists; the OS menu beats a rebuild
for keyboard/touch/SR) and exports `fieldSurfaceClass` so the annotation input shares
the exact field chrome; **Tooltip** composes the existing child as trigger via
base-ui's render prop, replacing `title=` on the Header and canvas-zoom icon buttons
(aria-labels stay). Still on native `title=`: the Tips popover trigger (a nested
base-ui Popover trigger) and the touch-first MobileSheet buttons.

### 5. Sanctioned residual literals (do not "fix" without a design pass)

These are deliberate, inventoried, not oversights:

- Inverted preset pill: `bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]`
  (inspector-sections.tsx) — the inversion _is_ the affordance; no token pair exists.
- Mixed `dark:text-neutral-500/400` pairs on caption badges — intentional hierarchy
  that predates ink tiers; migrating to ink-muted changes rendered colors.
- Tour card border `dark:border-white/[0.12]` (tour-chrome.tsx) — the one hairline
  variant that deliberately reads stronger on dark glass than the shared
  `hairline` token (10%); unifying would soften the tour card's edge.
- Control-chrome neutral pairs in the primitives (`bg-neutral-300
  dark:bg-neutral-600` Switch track and Checkbox border, `bg-neutral-200
  dark:bg-neutral-700` Slider track, Checkbox label `text-neutral-600
  dark:text-neutral-400`) — codified as-shipped; each value has one or two
  consumers, too few for a token to earn its indirection.
- `bg-emerald-500` chip dot (App.tsx mobile) vs `bg-green` elsewhere — the mobile dot
  is decorative; unifying changes pixels for no contract.
- Gradient glow shadows `shadow-blue-500/25`, `shadow-blue-500/20` — brand-glow effect
  distinct from the accent token.
- Spotlight glow `shadow-[0_0_20px_rgba(0,113,227,0.35)]` — the ring is tokenized,
  the glow literal (an effect, not a surface).
- `qrFg` hex literals in `card-theme.ts` — QRCodeSVG wants a color prop, not a class;
  binding comment in the file.
- `index.html` body background — pre-hydration paint outside the token system.

## Consequences

- New UI work references tokens; new literals need a reason (and a line here).
- Adding an adaptive token = add to `@theme` + the dark override block; adding a
  card token = `@theme` only, never the override block (guards enforce).
- Verification stack for theming: `pnpm smoke:theme` (OS-flip), `pnpm smoke:export`
  (real export pixels), unit guard tests, plus the existing pan/tour/zoom smokes.
