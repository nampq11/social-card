import { useRef, type RefObject } from 'react'
import { RotateCcw, Undo2, Redo2, Globe } from 'lucide-react'
import { useCardStore } from '../lib/card-store'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
import { InspectorTabsNav, useInspectorTab } from './inspector-tabs'
import { useSheetDrag } from '../lib/use-sheet-drag'

// Mobile Shell host (GLOSSARY.md / ADR 0002): a standard, NON-MODAL bottom
// sheet — one physical plane (iOS HIG): grabber → header → tab bar →
// scrollable content. The Canvas stays visible and live-updating. The sheet
// keeps the working height (58dvh, floored/clamped by the drag module) and
// slides between peek (chrome only, measured by the hook) and expanded via
// transform: 1:1 drag with rubber-banded edges, momentum projection on
// release, and a critically damped spring carrying the release velocity.
// The hook writes the sheet's coverage as the canvas's bottom padding
// only when a resting point is committed — on release from the projected
// destination, so the card refit runs concurrent with the spring (never
// per frame: per-frame layout writes starved iOS 18 WebKit's commit
// pipeline and the screen replayed stale drag frames, #53) — so
// Fit-to-View keeps the card fully visible at every resting sheet
// position (ADR 0002 addendum).
interface MobileSheetProps {
  canvasRef: RefObject<HTMLElement | null>
}

export function MobileSheet({ canvasRef }: MobileSheetProps) {
  const { copy, language, setLanguage } = useUiCopy()
  const resetCard = useCardStore((s) => s.resetCard)
  // Edit history joins Reset here on mobile — the Header keeps its copy only
  // from lg up, so touch users get their undo affordance in the sheet header.
  const canUndo = useCardStore((s) => s.canUndo)
  const canRedo = useCardStore((s) => s.canRedo)
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)
  const { tab, setTab, active } = useInspectorTab()

  const sheetRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { expanded, handleProps, dragProps } = useSheetDrag(sheetRef, canvasRef, contentRef)

  const tabTitle = copy[active.nameKey]

  // The tour anchor lives on the section, not this root: the root's rect is
  // the un-transformed layout box (at peek it spans empty canvas above the
  // translated sheet), while the section's rect tracks the sheet's live
  // transform — the surface the spotlight must hug.
  //
  // Anchored absolutely to the app root, never `fixed`: iOS 18 Safari's
  // compositor can displace fixed-anchored bottom sheets relative to the
  // document during toolbar transitions (WebKit 297779 family), which pinned
  // the sheet to the top of the screen mid-drag on-device while every local
  // engine stayed correct. The root's own box is the one coordinate system
  // the whole shell already shares, so the sheet cannot desync from it.
  return (
    <div className="absolute inset-x-0 bottom-0 z-40">
      <section
        ref={sheetRef}
        data-tour="inspector"
        aria-label={tabTitle}
        // Height/transform are written by the drag hook. Deliberately NOT
        // will-change:transform — layer promotion hands the sheet to the
        // compositor, and iOS 18's compositor displaces composited layers
        // at stale offsets around gestures (the sheet kept ghost-replaying
        // its dragged position on-device even after the absolute re-anchor).
        // The write budget addendum later traced the ghost to the
        // per-frame layout storm (#53), not the promotion — but promotion
        // still buys nothing: the drag transform is translate3d, which
        // already keeps the sheet on its own composited layer, so an
        // explicit hint would only re-add the displacement variable above.
        className="sheet-panel rounded-t-3xl border-b-0 overflow-hidden flex flex-col"
      >
        <button
          type="button"
          {...handleProps}
          aria-expanded={expanded}
          aria-label={copy.sheet_toggle_title}
          className="h-12 shrink-0 flex items-center justify-center cursor-pointer touch-none"
        >
          <span className="w-10 h-1.5 rounded-full bg-neutral-400/70 dark:bg-neutral-500/70" />
        </button>

        {/* Draggable chrome: taps fall through to the buttons; a real drag
            grabs the sheet (the hook swallows the trailing click). */}
        <div
          {...dragProps}
          className="flex items-center justify-between px-5 pb-2 shrink-0 touch-none"
        >
          <span className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            {copy.inspector_title}
          </span>
          <div className="flex items-center gap-1">
            <Button
              onClick={undo}
              disabled={!canUndo}
              variant="ghost"
              size="sm"
              title={copy.undo_button_title}
              aria-label={copy.undo_button_title}
            >
              <Undo2 />
            </Button>
            <Button
              onClick={redo}
              disabled={!canRedo}
              variant="ghost"
              size="sm"
              title={copy.redo_button_title}
              aria-label={copy.redo_button_title}
            >
              <Redo2 />
            </Button>
            <Button onClick={resetCard} variant="ghost" size="sm" title={copy.reset_title}>
              <RotateCcw />
              <span>{copy.reset_button}</span>
            </Button>
            {/* Language joins Reset on touch — the Header shows it from lg up. */}
            <Button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              title={copy.language_toggle_title}
              aria-label={copy.language_toggle_title}
              variant="ghost"
              size="sm"
              className="lg:hidden"
            >
              <Globe />
              <span>{language === 'vi' ? 'VI' : 'EN'}</span>
            </Button>
          </div>
        </div>

        {/* Tab bar inside the sheet plane (iOS HIG): grabber → header →
            tabs → content. The sheet header names the sheet, not the tab —
            the tab bar sits right below and would repeat it. */}
        <InspectorTabsNav tab={tab} onChange={setTab} className="px-3 pb-2 shrink-0" />

        {/* inert while peeked: clipped controls must not stay keyboard-reachable */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          inert={!expanded}
        >
          <div className="flex flex-col gap-5">
            {active.sectionList.map((Section) => (
              <Section key={Section.name} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
