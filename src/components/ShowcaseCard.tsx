import { CARD_THEME_STYLES } from '../constants/card-theme'
import type { CardState, CardTheme, Shot } from '../types'

// One Screenshot Slot (GLOSSARY.md): holds its Shot, or shows the dashed
// placeholder when empty — a pure preview affordance; capturing Shots is the
// Inspector's job (issue #33).
const Slot = ({
  shot,
  testId,
  sizeClassName,
  themeStyles,
}: {
  shot?: Shot
  testId: string
  sizeClassName: string
  themeStyles: (typeof CARD_THEME_STYLES)[CardTheme]
}) => (
  <div
    data-testid={testId}
    className={`overflow-hidden rounded-2xl ring-1 ${themeStyles.avatarBorder} ${sizeClassName}`}
  >
    {shot ? (
      <img src={shot.dataUrl} alt="" className="h-full w-full object-cover object-top" />
    ) : (
      <div
        data-testid="slot-placeholder"
        className={`h-full w-full rounded-2xl border-2 border-dashed ${themeStyles.border}`}
      />
    )}
  </div>
)

// The Showcase Card Type's preview body (GLOSSARY.md): Screenshot Slots in a
// hero-plus-details collage above the centered author footer. Renders no
// Quote content — headline, sublines and QR belong to the Quote Card only.
// One generalized layout as a function of shot count (issue #33): the first
// Shot takes the full-width Hero Slot, the rest sit side-by-side below.
export const ShowcaseCard = ({ card }: { card: CardState }) => {
  const themeStyles = CARD_THEME_STYLES[card.theme]
  const [hero, ...details] = card.showcase?.shots ?? []

  return (
    <div data-testid="shot-collage" className="flex min-h-0 flex-1 flex-col gap-4">
      <Slot
        testId="hero-slot"
        shot={hero}
        sizeClassName="min-h-0 flex-[3]"
        themeStyles={themeStyles}
      />
      {details.length > 0 && (
        <div className="flex min-h-0 flex-[2] gap-4">
          {details.map((shot) => (
            <Slot
              key={shot.id}
              testId="detail-slot"
              shot={shot}
              sizeClassName="min-h-0 flex-1"
              themeStyles={themeStyles}
            />
          ))}
        </div>
      )}
    </div>
  )
}
