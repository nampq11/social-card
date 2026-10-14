import { CARD_THEME_STYLES } from '../constants/card-theme'
import { FALLBACK_AUTHOR_NAME } from '../constants/presets'
import { splitLines } from '../lib/card-text'
import { DEFAULT_SHOT_FOCUS, shotAnchorCss } from '../lib/shot-fit'
import type { Annotation, AnnotationSide, CardState, CardTheme, Shot } from '../types'

// Fixed annotation anchors (issue #33): the side picks the margin around the
// target slot — never free-dragged. Tailwind edges do the parking (right-full
// = the mark's right edge sits on the slot's left edge), and the w-14 row
// matches the card's page margin so the text wraps inside it. Child order
// keeps the curve at the slot-facing end: normal row on the left, reversed
// on the right, column (curve last, pointing down) for top. The curve class
// re-aims the same preset stroke at the slot's edge from each margin.
const ANNOTATION_PLACEMENT: Record<AnnotationSide, { mark: string; curve: string }> = {
  left: { mark: 'right-full top-0 mr-1 flex w-14 flex-row', curve: '' },
  right: { mark: 'left-full top-0 ml-1 flex w-14 flex-row-reverse', curve: '-scale-x-100' },
  top: { mark: 'bottom-full left-0 mb-1 flex flex-col', curve: 'rotate-90' },
}

// The one preset stroke every annotation uses (issue #33): a handwritten
// arc ending in a small head, drawn pointing right; placement re-aims it.
const AnnotationCurve = ({ className }: { className: string }) => (
  <svg
    data-testid="annotation-curve"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    className={`h-5 w-5 shrink-0 ${className}`}
  >
    <path d="M2 4 C 8 2.5, 15 6, 16 14" />
    <path d="M16 14 l-4.6 -1.4 M16 14 l-0.6 -4.8" />
  </svg>
)

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
        <>
          {/* Fit (contain) fills the leftover area with a blurred cover copy
              of the same Shot — the genre's standard against letterbox bars
              (ADR 0005). Slightly oversized so the blur has no soft edges. */}
          {(shot.fit ?? 'cover') === 'contain' && (
            <img
              src={shot.dataUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
            />
          )}
          {/* Focus drives object-position natively (ADR 0005, amended):
              no ratio math, and the default 50% 0% is literally object-top.
              A Fit Shot shows whole, framed as a floating window card. */}
          <img
            src={shot.dataUrl}
            alt=""
            style={{
              objectPosition: shotAnchorCss(shot.focus ?? DEFAULT_SHOT_FOCUS, shot.fit ?? 'cover'),
            }}
            className={
              (shot.fit ?? 'cover') === 'contain'
                ? 'relative h-full w-full scale-[0.92] rounded-xl object-contain shadow-lg ring-1 ring-black/10'
                : 'relative h-full w-full object-cover'
            }
          />
        </>
      ) : (
        <div
          data-testid="slot-placeholder"
          className={`h-full w-full rounded-2xl border-2 border-dashed ${themeStyles.border}`}
        />
      )}
    </div>
    {shot && annotation && (
      <div
        data-testid="annotation"
        className={`pointer-events-none absolute font-hand text-[17px] leading-tight ${themeStyles.text} ${ANNOTATION_PLACEMENT[annotation.side].mark}`}
      >
        {/* One fixed size, ink from the active theme's text token; the curve
            inherits it through currentColor. Pointer events stay off: the
            preview is a pure render surface. */}
        <p className="break-words">{annotation.text}</p>
        <AnnotationCurve className={ANNOTATION_PLACEMENT[annotation.side].curve} />
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
