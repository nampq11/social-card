import { useState, useRef, useCallback } from 'react'
import { useCardStore } from './lib/card-store'
import { RATIO_INFO, ratioLabel } from './constants/ratios'
import type { AspectRatio } from './types'
import { useFitScale } from './lib/use-fit-scale'
import { useMediaQuery } from './lib/use-media-query'
import { useStudioShortcuts } from './lib/use-studio-shortcuts'
import { Inspector } from './components/Inspector'
import { MobileSheet } from './components/MobileSheet'
import { TipsPopover } from './components/TipsPopover'
import { WelcomeCard } from './components/WelcomeCard'
import { OnboardingTour } from './components/OnboardingTour'
import { useOnboarding } from './lib/onboarding'
import { CardPreview } from './components/CardPreview'
import { Header } from './components/Header'
import { copyCardToClipboard, downloadCardImage } from './lib/export'
import { toFilename } from './lib/card-text'
import { useFlash } from './lib/use-flash'
import { logDebug } from './lib/log-debug'
import { useUiCopy } from './lib/i18n'
import { Button } from './components/ui/Button'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Toaster, toast } from 'sonner'

const DESKTOP_QUERY = '(min-width: 1024px)'

export function App() {
  const { copy, language } = useUiCopy()
  // The Card State lives in its store; the app root only reads it for the
  // canvas toolbar label, the export filename, and the Fit-to-View sizes.
  const cardState = useCardStore((s) => s.card)
  const patchCard = useCardStore((s) => s.patchCard)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Desktop focus mode: collapsing the Inspector gives the card the whole
  // width; Fit-to-View refills the freed space via its ResizeObserver. The
  // state survives breakpoint crossings harmlessly (mobile renders the sheet,
  // not the sidebar).
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false)
  const toggleInspector = useCallback(() => setIsInspectorCollapsed((collapsed) => !collapsed), [])
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)
  useStudioShortcuts({ onUndo: undo, onRedo: redo, onToggleInspector: toggleInspector })

  // Export feedback is Sonner's job (promise toasts); the only transient
  // button state left here is the copy action's "Copied!" flag on useFlash.
  const [isCopied, copiedFlag] = useFlash<boolean>(false)

  // First-run onboarding lives purely in the UI layer — it never touches
  // Card State; both paths (tour taken or skipped) persist via localStorage.
  const { isWelcomeOpen, isTourOpen, startTour, dismissWelcome, endTour } = useOnboarding()

  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const { width: cardWidth, height: cardHeight } = RATIO_INFO[cardState.ratio]
  const { scale, mode, zoomIn, zoomOut, fit } = useFitScale(canvasRef, cardWidth, cardHeight)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const cycleRatio = useCallback(() => {
    const ratios: AspectRatio[] = ['1:1', '4:5', '16:9']
    const nextIdx = (ratios.indexOf(cardState.ratio) + 1) % ratios.length
    patchCard({ ratio: ratios[nextIdx] })
  }, [cardState.ratio, patchCard])

  // Shared shell for export actions: guards re-entry, then flows the action
  // through one promise-style toast (processing → success/error) — Sonner
  // owns queueing, timing and interruption, the UI Copy stays ours.
  const runExport = (
    action: (card: HTMLDivElement) => Promise<unknown>,
    messages: { loading: string; success: string; error: string },
    onSuccess?: () => void,
  ) => {
    const card = cardRef.current
    if (!card || isExporting) return
    setIsExporting(true)
    const request = action(card)
    toast.promise(request, {
      loading: messages.loading,
      success: () => {
        onSuccess?.()
        return messages.success
      },
      error: messages.error,
    })
    // Sonner turns the rejection into the error toast; this catch keeps the
    // failure log and clears the re-entry guard on either outcome.
    request
      .catch((err) => logDebug('App.runExport', `export failed during "${messages.loading}"`, err))
      .finally(() => setIsExporting(false))
  }

  const handleCopy = () =>
    runExport(
      (card) => copyCardToClipboard(card),
      {
        loading: copy.copy_processing,
        success: copy.copy_success,
        error: copy.copy_error,
      },
      () => copiedFlag.flash(true, 3500),
    )

  const handleDownload = () =>
    runExport((card) => downloadCardImage(card, toFilename(cardState.headline)), {
      loading: copy.download_processing,
      success: copy.download_success,
      error: copy.download_error,
    })

  // Apple HIG Canvas-first Studio shell: 100vw × 100vh with seamless dot-grid canvas.
  // The page never scrolls; floating header, floating inspector, and floating zoom HUD.
  return (
    <div className="h-dvh w-screen overflow-hidden apple-canvas-bg text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-200 select-none">
      <Header
        onCopy={handleCopy}
        onDownload={handleDownload}
        isCopied={isCopied}
        isExporting={isExporting}
        isDesktop={isDesktop}
        isInspectorCollapsed={isInspectorCollapsed}
        onToggleInspector={toggleInspector}
        onCycleRatio={cycleRatio}
        onReplayTour={startTour}
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
          className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-[padding] duration-300 ${
            isDesktop ? (isInspectorCollapsed ? 'p-8' : 'p-8 pl-[380px]') : 'p-4'
          }`}
        >
          {/* Fit refits per frame while the sheet drags — only manual
              zoom steps may animate the scale. */}
          <CardPreview ref={cardRef} scale={scale} animated={mode === 'manual'} />

          {/* Mobile overlay chips (ratio + tips) — below lg */}
          {!isDesktop && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <button
                type="button"
                onClick={cycleRatio}
                title={
                  language === 'vi'
                    ? 'Bấm để chuyển đổi tỷ lệ khung hình'
                    : 'Click to cycle aspect ratio'
                }
                aria-label={
                  language === 'vi'
                    ? 'Bấm để chuyển đổi tỷ lệ khung hình'
                    : 'Click to cycle aspect ratio'
                }
                className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur px-2.5 py-1 shadow-sm border border-black/[0.04] dark:border-white/[0.06] cursor-pointer active:scale-95 transition max-w-[calc(100vw-5rem)] truncate"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="truncate">{ratioLabel(cardState.ratio, language)}</span>
              </button>
              <TipsPopover onReplayTour={startTour} />
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

      {/* Export feedback lives in this toast region — bottom-center per spec. */}
      <Toaster position="bottom-center" />
    </div>
  )
}

export default App
