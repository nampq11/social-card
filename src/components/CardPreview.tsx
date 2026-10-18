import { forwardRef } from 'react'
import { useCardStore } from '../lib/card-store'
import { RATIO_INFO } from '../constants/ratios'
import { CARD_THEME_STYLES } from '../constants/card-theme'
import { ShowcaseCard } from './ShowcaseCard'
import { QuoteCard } from './QuoteCard'
import { DefinitionCard } from './DefinitionCard'
import type { CardState, CardType } from '../types'

interface CardPreviewProps {
  scale?: number
  /** Fit-driven refits change scale per frame; only manual zoom steps animate. */
  animated?: boolean
}

// One body component per Card Type (ADR 0009): the Record keyed by CardType
// makes "a type with no renderer" a compile error, and CardPreview keeps only
// the shared frame — the ratio-sized export node, theme tokens, and the
// fit-scale transform. Each body receives the whole CardState (shared footer
// fields) and paints its own interior.
const CARD_BODIES: Record<CardType, React.FC<{ card: CardState }>> = {
  quote: QuoteCard,
  showcase: ShowcaseCard,
  definition: DefinitionCard,
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(
  ({ scale = 1, animated = true }, ref) => {
    const data = useCardStore((s) => s.card)
    const { width, height } = RATIO_INFO[data.ratio]

    const themeStyles = CARD_THEME_STYLES[data.theme]
    const Body = CARD_BODIES[data.cardType]

    return (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          // card-elevation's transform transition (unlayered CSS — Tailwind
          // classes can't override it) trails per-frame fit writes behind the
          // fit target while the Mobile Sheet drags or a window resize
          // streams. Suppressing only transform keeps its other morphs
          // (ratio-swap width/height) animating.
          ...(animated ? {} : { transitionProperty: 'width, height, background-color, color' }),
        }}
        className={`${
          animated ? 'transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]' : ''
        } card-elevation rounded-3xl`}
      >
        <div
          ref={ref}
          id="social-card-node"
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`${themeStyles.bg} ${themeStyles.text} relative flex flex-col justify-between p-14 select-none shrink-0 overflow-hidden rounded-3xl`}
        >
          <Body card={data} />
        </div>
      </div>
    )
  },
)

CardPreview.displayName = 'CardPreview'
