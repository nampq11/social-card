import { useRef, useState, type RefObject } from 'react'
import { RotateCcw, Undo2, Redo2, Sparkles } from 'lucide-react'
import { SegmentedControl } from './SegmentedControl'
import { useCardStore } from '../lib/card-store'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
import { INSPECTOR_TABS, type InspectorTabId } from './inspector-tabs'
import { useSheetDrag } from '../lib/use-sheet-drag'

// Mobile Shell host (GLOSSARY.md / ADR 0002): a standard, NON-MODAL bottom
// sheet — one physical plane (iOS HIG): grabber → header → tab bar →
// scrollable content. The Canvas stays visible and live-updating. The sheet
// keeps the working height (58dvh, floored/clamped by the drag module) and
// slides between peek (chrome only, measured by the hook) and expanded via
// transform: 1:1 drag with rubber-banded edges, momentum projection on
// release, and a critically damped spring carrying the release velocity.
// The hook writes the static reserve (chrome height at rest) straight to
// the canvas padding, so Fit-to-View keeps the card fully visible as the
// sheet moves.
interface MobileSheetProps {
  canvasRef: RefObject<HTMLElement | null>
}

export function MobileSheet({ canvasRef }: MobileSheetProps) {
  const { copy } = useUiCopy()
  const resetCard = useCardStore((s) => s.resetCard)
  // Edit history joins Reset here on mobile — the Header keeps its copy only
  // from lg up, so touch users get their undo affordance in the sheet header.
  const canUndo = useCardStore((s) => s.canUndo)
  const canRedo = useCardStore((s) => s.canRedo)
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)
  const [tab, setTab] = useState<InspectorTabId>('content')

  const sheetRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { expanded, handleProps, dragProps } = useSheetDrag(sheetRef, canvasRef, contentRef)

  const active = INSPECTOR_TABS.find((t) => t.id === tab) ?? INSPECTOR_TABS[0]
  const tabTitle = copy[active.nameKey]

  return (
    <div data-tour="inspector" className="fixed inset-x-0 bottom-0 z-40">
      <section
        ref={sheetRef}
        aria-label={tabTitle}
        // Height/transform are written by the drag hook; will-change keeps
        // the per-frame transform on the compositor.
        className="glass-panel rounded-t-3xl border-b-0 overflow-hidden flex flex-col will-change-transform"
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
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
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
          </div>
        </div>

        {/* Tab bar inside the sheet plane (iOS HIG): grabber → header →
            tabs → content. The sheet header names the sheet, not the tab —
            the tab bar sits right below and would repeat it. */}
        <nav
          data-tour="inspector-tabs"
          aria-label={copy.inspector_title}
          className="px-3 pb-2 shrink-0"
        >
          <SegmentedControl<InspectorTabId>
            value={tab}
            onChange={setTab}
            options={INSPECTOR_TABS.map(({ id, nameKey, icon }) => ({
              value: id,
              label: copy[nameKey],
              icon,
            }))}
          />
        </nav>

        {/* inert while peeked: clipped controls must not stay keyboard-reachable */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          inert={!expanded}
        >
          <div className="flex flex-col gap-5">
            {active.sections.map((Section) => (
              <Section key={Section.name} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
