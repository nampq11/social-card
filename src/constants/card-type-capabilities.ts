import type { CardType } from '../types'

// The per-type profile of which Inspector and shell controls are honest to
// show. One row per Card Type; a control that would edit a field the type
// never renders is worse than no control (spec #33's rule), so each flag
// names a policy that real consumers read — StyleSection consumes all four,
// the header's ratio pill, the mobile ratio chip, and the store's type
// switch (the pin on switch) read ratioSelectable. No speculative flags:
// an entry exists only when some surface queries it.
export interface CardTypeCapabilities {
  /** The ratio control and the header's ratio cycler. Types whose layout
   *  breaks off-square (the Showcase collage) pin their ratio instead —
   *  switchCardType enforces that pin from this flag, one policy home. */
  ratioSelectable: boolean
  /** The theme swatches. Types that paint their own background — the
   *  Definition Card's photo under a scrim — cover the theme entirely. */
  themeSelectable: boolean
  /** The headline size slider and uppercase checkbox (Quote-only fields). */
  headlineControls: boolean
  /** The style preset grid (presets write Quote-only style fields). */
  stylePresets: boolean
}

export const CARD_TYPE_CAPABILITIES: Record<CardType, CardTypeCapabilities> = {
  quote: {
    ratioSelectable: true,
    themeSelectable: true,
    headlineControls: true,
    stylePresets: true,
  },
  showcase: {
    ratioSelectable: false,
    themeSelectable: true,
    headlineControls: false,
    stylePresets: false,
  },
  definition: {
    ratioSelectable: true,
    themeSelectable: false,
    headlineControls: false,
    stylePresets: false,
  },
}
