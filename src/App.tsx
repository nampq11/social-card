import { useState, useRef, useCallback } from 'react'
import { useCardStore } from './lib/card-store'
import { RATIO_INFO } from './constants/ratios'
import type { AspectRatio } from './types'
import { useFitScale } from './lib/use-fit-scale'
import { useMediaQuery } from './lib/use-media-query'
import { useStudioShortcuts } from './lib/use-studio-shortcuts'
import { Inspector } from './components/Inspector'
import { MobileSheet } from './components/MobileSheet'
import { TipsPopover } from './components/TipsPopover'
import { WelcomeCard } from './components/WelcomeCard'
import { OnboardingTour } from './components/OnboardingTour'
import { ShotFitTour } from './components/ShotFitTour'
import { useShotFitTour } from './lib/onboarding'
import { useOnboarding } from './lib/onboarding'
import { Header } from './components/Header'
import { CardPreview } from './components/CardPreview'
import { useCardExport } from './lib/use-card-export'
import { useUiCopy, type UiStringKey } from './lib/i18n'
import { Button } from './components/ui/Button'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Toaster } from 'sonner'

const DESKTOP_QUERY = '(min-width: 1024px)'

/** Canvas padding follows the shell: mobile keeps a slim margin; desktop
 * reserves the floating Inspector's rail unless focus mode collapsed it. */
function canvasPaddingClass(isDesktop: boolean, inspectorCollapsed: boolean): string {
  // Mobile top padding clears the floating ratio-chip row (top-3 + its
  // 44pt touch target + breathing room) so fit-to-view never tucks the
  // card under the chips.
  if (!isDesktop) return 'px-4 pt-16 pb-4'
  if (inspectorCollapsed) return 'p-8'
  return 'p-8 pl-[380px]'
}

/** Mobile chip shows the short localized ratio name — no px specs (the
 * desktop header owns the full specs; HIG keeps touch labels compact). */
const RATIO_LABEL_KEY: Record<AspectRatio, UiStringKey> = {
  '1:1': 'ratio_square',
  '4:5': 'ratio_portrait',
  '16:9': 'ratio_landscape',
}

export function App() {
  const { copy } = useUiCopy()
  // The Card State lives in its store; the app root only reads it for the
  // canvas toolbar label and the Fit-to-View sizes.
  const cardState = useCardStore((s) => s.card)
  const patchCard = useCardStore((s) => s.patchCard)

  // Desktop focus mode: collapsing the Inspector gives the card the whole
  // width; Fit-to-View refills the freed space via its ResizeObserver. The
  // state survives breakpoint crossings harmlessly (mobile renders the sheet,
  // not the sidebar).
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false)
  const toggleInspector = useCallback(() => setIsInspectorCollapsed((collapsed) => !collapsed), [])
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)

  // Card Export (GLOSSARY.md): the export node, re-entry guard, feedback
  // toasts and the Copied! flash all live in one module — the app root only
  // forwards its interface to the Header and the keyboard shortcuts.
  const { cardRef, isExporting, isCopied, copy: copyCard, download: downloadCard } = useCardExport()

  // First-run onboarding lives purely in the UI layer — it never touches
  // Card State; both paths (tour taken or skipped) persist via localStorage.
  const { isWelcomeOpen, isTourOpen, startTour, dismissWelcome, endTour } = useOnboarding()
  // The shot-gestures tour fires once, at the first Shot on a Showcase card
  // once the welcome flow has cleared (lib/onboarding).
  const shotArmed = cardState.cardType === 'showcase' && (cardState.showcase?.shots.length ?? 0) > 0
  const {
    isTourOpen: isFitTourOpen,
    endTour: endFitTour,
    replayTour: replayFitTour,
  } = useShotFitTour(shotArmed, !isWelcomeOpen)

  const canvasRef = useRef<HTMLDivElement>(null)
  const { width: cardWidth, height: cardHeight } = RATIO_INFO[cardState.ratio]
  const { scale, mode, zoomIn, zoomOut, fit } = useFitScale(canvasRef, cardWidth, cardHeight)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const cycleRatio = useCallback(() => {
    const ratios: AspectRatio[] = ['1:1', '4:5', '16:9']
    const nextIdx = (ratios.indexOf(cardState.ratio) + 1) % ratios.length
    patchCard({ ratio: ratios[nextIdx] })
  }, [cardState.ratio, patchCard])

  useStudioShortcuts({
    onUndo: undo,
    onRedo: redo,
    onToggleInspector: toggleInspector,
    onCopy: copyCard,
  })

  // Apple HIG Canvas-first Studio shell: 100vw × 100vh with seamless dot-grid canvas.
  // The page never scrolls; floating header, floating inspector, and floating zoom HUD.
  return (
    <div className="h-dvh w-screen overflow-hidden apple-canvas-bg text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-200 select-none">
      <Header
        onCopy={copyCard}
        onDownload={downloadCard}
        isCopied={isCopied}
        isExporting={isExporting}
        isDesktop={isDesktop}
        isInspectorCollapsed={isInspectorCollapsed}
        onToggleInspector={toggleInspector}
        onCycleRatio={cycleRatio}
        onReplayTour={startTour}
        onReplayShotFitTour={replayFitTour}
      />

      {/* Main Workspace (Floating Inspector + Infinite Canvas) */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
        {/* Floating Left Inspector Panel */}
        {isDesktop && !isInspectorCollapsed && (
          <div className="z-20 absolute left-4 top-3 bottom-4 pointer-events-auto flex items-start">
            <Inspector />
          </div>
        )}

        {/* Center Stage: Card Preview Canvas */}
        <main
          ref={canvasRef}
          className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-[padding] duration-300 ${canvasPaddingClass(isDesktop, isInspectorCollapsed)}`}
        >
          {/* Fit refits per frame while the sheet drags — only manual
              zoom steps may animate the scale. */}
          <CardPreview ref={cardRef} scale={scale} animated={mode === 'manual'} />

          {/* Mobile overlay chips (ratio + tips) — centered on the card's
              axis (below lg); a left-anchored pill would skew the app's
              vertical axis against the centered Card. */}
          {!isDesktop && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <button
                type="button"
                onClick={cycleRatio}
                title={copy.ratio_cycle_title}
                aria-label={copy.ratio_cycle_title}
                className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur px-2.5 py-1 shadow-sm border border-black/[0.04] dark:border-white/[0.06] cursor-pointer active:scale-95 transition max-w-[calc(100vw-5rem)] truncate [@media(pointer:coarse)]:min-h-11"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="truncate">{copy[RATIO_LABEL_KEY[cardState.ratio]]}</span>
              </button>
              <TipsPopover onReplayTour={startTour} onReplayShotFitTour={replayFitTour} />
            </div>
          )}
        </main>

        {/* Floating Bottom-Right Zoom HUD (Desktop) */}
        {isDesktop && (
          <div className="z-20 absolute right-4 bottom-4 rounded-full apple-glass px-2 py-1 flex items-center gap-1 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              title={copy.zoom_out_title}
              aria-label={copy.zoom_out_title}
              className="rounded-full w-7 h-7"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <button
              type="button"
              onClick={fit}
              title={copy.zoom_fit_title}
              className="px-2 py-0.5 rounded-md hover:bg-black/[0.06] dark:hover:bg-white/[0.08] font-mono text-xs min-w-[48px] text-center cursor-pointer select-none"
            >
              {Math.round(scale * 100)}%
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              title={copy.zoom_in_title}
              aria-label={copy.zoom_in_title}
              className="rounded-full w-7 h-7"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <div className="h-3.5 w-[1px] bg-black/10 dark:bg-white/10 mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              onClick={fit}
              title={copy.zoom_fit_title}
              aria-label={copy.zoom_fit_title}
              className={`rounded-full w-7 h-7 ${mode === 'fit' ? 'opacity-40' : ''}`}
            >
              <Maximize className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!isDesktop && <MobileSheet canvasRef={canvasRef} />}

      {/* First-run onboarding: welcome gate + opt-in spotlight tour. */}
      <WelcomeCard open={isWelcomeOpen} onStartTour={startTour} onSkip={dismissWelcome} />
      <OnboardingTour open={isTourOpen} onOpenChange={(next) => !next && endTour()} />
      <ShotFitTour open={isFitTourOpen} onOpenChange={(next) => !next && endFitTour()} />

      {/* Export feedback lives in this toast region — bottom-center per spec. */}
      <Toaster position="bottom-center" />
    </div>
  )
}

export default App
