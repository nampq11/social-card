import { CARD_THEME_STYLES } from '../constants/card-theme'
import { useRef, useState } from 'react'
import { FALLBACK_AUTHOR_NAME } from '../constants/presets'
import { splitLines } from '../lib/card-text'
import { clampScale, DEFAULT_SHOT_FOCUS, shotAnchorCss } from '../lib/shot-fit'
import { useEffectiveFit } from '../lib/use-effective-fit'
import { useShotPan } from '../lib/use-shot-pan'
import { useUiCopy } from '../lib/i18n'
import { useCardStore } from '../lib/card-store'
import type { Annotation, AnnotationSide, CardState, CardTheme, Shot, ShotFit } from '../types'

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

// The selection chrome (ADR 0006 §2): [Đặt lại] clears the Shot's whole
// adjustment set — fit override, Focus, Scale — back to the derived
// defaults; [Xong] disarms the Shot. Lives on an export-excluded overlay so
// Card Export never captures the ring or the buttons.
const PanOverlayButton = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="cursor-pointer rounded-full bg-black/60 px-2.5 py-1 text-xs text-white transition-colors hover:bg-black/80"
  >
    {children}
  </button>
)

// The front-facing Shot image: renders Focus via object-position and carries
// the pan gesture surface when interactive (cover shots; armed on touch,
// always on hover-capable pointers — ADR 0005).
const ShotImage = ({
  shot,
  fit,
  selected,
  onSelect,
}: {
  shot: Shot
  fit: ShotFit
  selected: boolean
  onSelect: (shotId: string | null) => void
}) => {
  const pan = useShotPan(shot.id, fit, selected, onSelect)
  // Local binding: the linter's ref rule flags `pan.wheelElement` member
  // access in the JSX, though passing a ref object to ref= is legal.
  const { wheelElement } = pan
  const windowCard = fit === 'contain'
  // Zoom (ADR 0006 §4): scale about the focus anchor — object-position
  // percentages align content and box fractions, so the anchored content
  // point stays put while zooming. No transform at scale 1: the unzoomed
  // render stays byte-identical to the ADR 0005 one.
  const anchor = shotAnchorCss(shot.focus ?? DEFAULT_SHOT_FOCUS, fit)
  const zoom = fit === 'cover' ? clampScale(shot.scale ?? 1) : 1
  // Translate (rubber-band excess, slot px) sits BEFORE the zoom scale so
  // both stay in their own coordinate space.
  const transform =
    [
      zoom > 1 && `scale(${zoom})`,
      pan.overdrag && `translate(${pan.overdrag.x}px, ${pan.overdrag.y}px)`,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  return (
    <img
      ref={wheelElement}
      src={shot.dataUrl}
      alt=""
      onPointerDown={pan.handlers.onPointerDown}
      onPointerMove={pan.handlers.onPointerMove}
      onPointerUp={pan.handlers.onPointerUp}
      onPointerCancel={pan.handlers.onPointerCancel}
      style={{
        objectPosition: anchor,
        ...(transform ? { transform, ...(zoom > 1 ? { transformOrigin: anchor } : {}) } : {}),
      }}
      className={`relative h-full w-full ${
        windowCard
          ? 'scale-[0.92] rounded-xl object-contain shadow-lg ring-1 ring-black/10'
          : `object-cover ${pan.interactive ? 'touch-none cursor-grab' : ''} ${
              pan.dragging ? 'cursor-grabbing' : ''
            }`
      }`}
    />
  )
}

// One Screenshot Slot (GLOSSARY.md): holds its Shot, or shows the dashed
// placeholder when empty. Rendering is the Card Preview's job; panning an
// armed Shot is the one interaction the preview owns (ADR 0005).
const Slot = ({
  shot,
  testId,
  sizeClassName,
  themeStyles,
  annotation,
  selected,
  onSelect,
}: {
  shot?: Shot
  testId: string
  sizeClassName: string
  themeStyles: (typeof CARD_THEME_STYLES)[CardTheme]
  annotation?: Annotation
  selected: boolean
  onSelect: (shotId: string | null) => void
}) => {
  const { copy } = useUiCopy()
  const clearShotAdjustments = useCardStore((s) => s.clearShotAdjustments)
  const setShotFit = useCardStore((s) => s.setShotFit)
  const slotRef = useRef<HTMLDivElement>(null)
  // The effective Fit (override or ratio-derived, ADR 0006 §1) drives the
  // backdrop, the Shot's render, and the pill's toggle label from one source.
  const fit = useEffectiveFit(shot, slotRef)
  return (
    <div
      ref={slotRef}
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
            {fit === 'contain' && (
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
            <ShotImage shot={shot} fit={fit} selected={selected} onSelect={onSelect} />
          </>
        ) : (
          <div
            data-testid="slot-placeholder"
            className={`h-full w-full rounded-2xl border-2 border-dashed ${themeStyles.border}`}
          />
        )}
      </div>
      {selected && shot && (
        <div
          data-testid="shot-pan-overlay"
          data-export-exclude="true"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-blue-600 dark:ring-blue-500"
        >
          <div className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            <PanOverlayButton
              onClick={() => setShotFit(shot.id, fit === 'contain' ? 'cover' : 'contain')}
            >
              {fit === 'contain' ? copy.shot_fit_cover : copy.shot_fit_contain}
            </PanOverlayButton>
            <PanOverlayButton onClick={() => clearShotAdjustments(shot.id)}>
              {copy.shot_reset_label}
            </PanOverlayButton>
            <PanOverlayButton onClick={() => onSelect(null)}>
              {copy.shot_done_label}
            </PanOverlayButton>
          </div>
        </div>
      )}
      {shot && annotation && (
        <div
          data-testid="annotation"
          className={`pointer-events-none absolute font-hand text-[17px] leading-tight ${themeStyles.text} ${ANNOTATION_PLACEMENT[annotation.side].mark}`}
        >
          {/* One fixed size, ink from the active theme's text token; the curve
              inherits it through currentColor. Pointer events stay off: the
              annotation is not interactive. */}
          <p className="break-words">{annotation.text}</p>
          <AnnotationCurve className={ANNOTATION_PLACEMENT[annotation.side].curve} />
        </div>
      )}
    </div>
  )
}

// The Showcase Card Type's preview body (GLOSSARY.md): Screenshot Slots in a
// hero-plus-details collage above the centered author footer. Renders no
// Quote content — headline, sublines and QR belong to the Quote Card only.
// One generalized layout as a function of shot count (issue #33): the first
// Shot takes the full-width Hero Slot, the rest sit side-by-side below.
export const ShowcaseCard = ({ card }: { card: CardState }) => {
  const themeStyles = CARD_THEME_STYLES[card.theme]
  const [hero, ...details] = card.showcase?.shots ?? []
  const bioLines = splitLines(card.authorBio)
  // Canvas pan selection is UI-transient — which Shot the user armed — so it
  // lives here, not in the Card State.
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null)
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
          selected={selectedShotId === hero?.id}
          onSelect={setSelectedShotId}
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
                selected={selectedShotId === shot.id}
                onSelect={setSelectedShotId}
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
