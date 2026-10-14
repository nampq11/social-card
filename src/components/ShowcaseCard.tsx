import { CARD_THEME_STYLES } from '../constants/card-theme'
import type { CardState } from '../types'

// The Showcase Card Type's preview body (GLOSSARY.md): Screenshot Slots in a
// hero-plus-details collage above the centered author footer. Renders no
// Quote content — headline, sublines and QR belong to the Quote Card only.
export const ShowcaseCard = ({ card }: { card: CardState }) => {
  const themeStyles = CARD_THEME_STYLES[card.theme]

  return (
    <div data-testid="shot-collage" className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        data-testid="hero-slot"
        className={`min-h-0 flex-[3] overflow-hidden rounded-2xl ring-1 ${themeStyles.avatarBorder}`}
      >
        {/* An empty Slot shows the dashed placeholder — a pure preview
            affordance; capturing Shots is the Inspector's job (issue #33). */}
        <div
          data-testid="slot-placeholder"
          className={`h-full w-full rounded-2xl border-2 border-dashed ${themeStyles.border}`}
        />
      </div>
    </div>
  )
}
