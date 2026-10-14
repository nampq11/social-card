import { CARD_THEME_STYLES } from '../constants/card-theme'
import { FALLBACK_AUTHOR_NAME } from '../constants/presets'
import { splitLines } from '../lib/card-text'
import type { Annotation, CardState, CardTheme, Shot } from '../types'

// One Screenshot Slot (GLOSSARY.md): holds its Shot, or shows the dashed
// placeholder when empty — a pure preview affordance; capturing Shots is the
// Inspector's job (issue #33).
const Slot = ({
  shot,
  testId,
  sizeClassName,
  themeStyles,
  annotation,
}: {
  shot?: Shot
  testId: string
  sizeClassName: string
  themeStyles: (typeof CARD_THEME_STYLES)[CardTheme]
  annotation?: Annotation
}) => (
  <div
    data-testid={testId}
    className={`relative rounded-2xl ring-1 ${themeStyles.avatarBorder} ${sizeClassName}`}
  >
    {/* The slot clips its Shot; the annotation mark must overflow into the
        margin, so clipping stays on the inner box (issue #33). */}
    <div className="h-full w-full overflow-hidden rounded-2xl">
      {shot ? (
        <img src={shot.dataUrl} alt="" className="h-full w-full object-cover object-top" />
      ) : (
        <div
          data-testid="slot-placeholder"
          className={`h-full w-full rounded-2xl border-2 border-dashed ${themeStyles.border}`}
        />
      )}
    </div>
    {shot && annotation && (
      <div data-testid="annotation">
        <p>{annotation.text}</p>
      </div>
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
  const bioLines = splitLines(card.authorBio)
  // Annotations bind to Shots (issue #33): the lookup is by the Shot's stable
  // id, so an annotation renders wherever its Shot currently sits.
  const annotationFor = (shotId: string) =>
    card.showcase?.annotations.find((annotation) => annotation.shotId === shotId)

  return (
    <>
      <div data-testid="shot-collage" className="flex min-h-0 flex-1 flex-col gap-4">
        <Slot
          testId="hero-slot"
          shot={hero}
          sizeClassName="min-h-0 flex-[3]"
          themeStyles={themeStyles}
          annotation={hero ? annotationFor(hero.id) : undefined}
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
                annotation={annotationFor(shot.id)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Centered author footer: avatar above name + bio; without an avatar,
          name + bio alone — no monogram stand-in (issue #33). */}
      <footer
        data-testid="card-footer"
        className="flex flex-col items-center gap-2 border-t border-transparent pt-6"
      >
        {card.avatarUrl && (
          <div
            className={`h-14 w-14 overflow-hidden rounded-full shadow-sm ring-1 ${themeStyles.avatarBorder}`}
          >
            <img
              src={card.avatarUrl}
              alt={card.authorName || FALLBACK_AUTHOR_NAME}
              className={`h-full w-full object-cover object-top ${card.avatarGrayscale ? 'grayscale' : ''}`}
            />
          </div>
        )}
        <div className="text-center">
          <h3 className="text-sm font-bold tracking-tight leading-tight break-words">
            {card.authorName || FALLBACK_AUTHOR_NAME}
          </h3>
          {bioLines.length > 0 && (
            <div
              data-testid="author-bio"
              className={`mt-0.5 text-xs font-normal italic leading-tight break-words ${themeStyles.subtext}`}
            >
              {bioLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </footer>
    </>
  )
}
