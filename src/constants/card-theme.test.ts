import { describe, expect, it } from 'vitest'
import { CARD_THEME_STYLES } from './card-theme'

describe('CARD_THEME_STYLES', () => {
  // The export contract: a card theme paints the exported image, so its
  // classes must never carry a dark: half — the card renders identically
  // in both OS color schemes (also asserted on real pixels by smoke:theme).
  it('theme classes are static — never OS-adaptive', () => {
    for (const [theme, styles] of Object.entries(CARD_THEME_STYLES))
      for (const [key, value] of Object.entries(styles))
        expect(value, `${theme}.${key}`).not.toMatch(/dark:/)
  })
})
