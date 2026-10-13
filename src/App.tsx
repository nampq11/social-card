import { useState, useRef, useCallback } from 'react';
import { useCardStore } from './lib/card-store';
import { RATIO_INFO, ratioLabel } from './constants/ratios';
import { useFitScale } from './lib/use-fit-scale';
import { useMediaQuery } from './lib/use-media-query';
import { useStudioShortcuts } from './lib/use-studio-shortcuts';
import { Inspector } from './components/Inspector';
import { MobileSheet } from './components/MobileSheet';
import { TipsPopover } from './components/TipsPopover';
import { CardPreview } from './components/CardPreview';
import { Header } from './components/Header';
import { copyCardToClipboard, downloadCardImage } from './lib/export';
import { toFilename } from './lib/card-text';
import { useFlash } from './lib/use-flash';
import { logDebug } from './lib/log-debug';
import { useUiCopy } from './lib/i18n';
import { Button } from './components/ui/Button';
import { ZoomIn, ZoomOut, Maximize, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const DESKTOP_QUERY = '(min-width: 1024px)';

export function App() {
  const { copy, language } = useUiCopy();
  // The Card State lives in its store; the app root only reads it for the
  // canvas toolbar label, the export filename, and the Fit-to-View sizes.
  const cardState = useCardStore((s) => s.card);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Desktop focus mode: collapsing the Inspector gives the card the whole
  // width; Fit-to-View refills the freed space via its ResizeObserver. The
  // state survives breakpoint crossings harmlessly (mobile renders the sheet,
  // not the sidebar).
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const toggleInspector = useCallback(
    () => setIsInspectorCollapsed((collapsed) => !collapsed),
    [],
  );
  const undo = useCardStore((s) => s.undo);
  const redo = useCardStore((s) => s.redo);
  useStudioShortcuts({ onUndo: undo, onRedo: redo, onToggleInspector: toggleInspector });

  // Export feedback is Sonner's job (promise toasts); the only transient
  // button state left here is the copy action's "Copied!" flag on useFlash.
  const [isCopied, copiedFlag] = useFlash<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { width: cardWidth, height: cardHeight } = RATIO_INFO[cardState.ratio];
  const { scale, mode, zoomIn, zoomOut, fit } = useFitScale(canvasRef, cardWidth, cardHeight);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  // Shared shell for export actions: guards re-entry, then flows the action
  // through one promise-style toast (processing → success/error) — Sonner
  // owns queueing, timing and interruption, the UI Copy stays ours.
  const runExport = (
    action: (card: HTMLDivElement) => Promise<unknown>,
    messages: { loading: string; success: string; error: string },
    onSuccess?: () => void
  ) => {
    const card = cardRef.current;
    if (!card || isExporting) return;
    setIsExporting(true);
    const request = action(card);
    toast.promise(request, {
      loading: messages.loading,
      success: () => {
        onSuccess?.();
        return messages.success;
      },
      error: messages.error,
    });
    // Sonner turns the rejection into the error toast; this catch keeps the
    // failure log and clears the re-entry guard on either outcome.
    request
      .catch((err) => logDebug('App.runExport', `export failed during "${messages.loading}"`, err))
      .finally(() => setIsExporting(false));
  };

  const handleCopy = () =>
    runExport(
      (card) => copyCardToClipboard(card),
      {
        loading: copy.copy_processing,
        success: copy.copy_success,
        error: copy.copy_error,
      },
      () => copiedFlag.flash(true, 3500)
    );

  const handleDownload = () =>
    runExport(
      (card) => downloadCardImage(card, toFilename(cardState.headline)),
      {
        loading: copy.download_processing,
        success: copy.download_success,
        error: copy.download_error,
      }
    );

  // One-Screen Studio shell (GLOSSARY.md / ADR 0002): h-dvh + overflow-hidden,
  // the page never scrolls — only the Inspector / sheet inside it can.
  return (
    <div className="h-dvh overflow-hidden bg-[#F5F5F7] dark:bg-[#0B0B0C] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-200">
      <Header
        onCopy={handleCopy}
        onDownload={handleDownload}
        isCopied={isCopied}
        isExporting={isExporting}
      />

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 pb-3 flex gap-6 items-stretch">
        {isDesktop && !isInspectorCollapsed && <Inspector />}

        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* Canvas Viewport Toolbar (desktop) — tips live in the popover */}
          {isDesktop && (
            <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  onClick={toggleInspector}
                  title={copy.inspector_toggle_title}
                  aria-label={copy.inspector_toggle_title}
                >
                  {isInspectorCollapsed ? (
                    <PanelLeftOpen className="w-3.5 h-3.5" />
                  ) : (
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  )}
                </Button>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="font-medium">{ratioLabel(cardState.ratio, language)}</span>
                <TipsPopover />
              </div>

              {/* Zoom Controls — manual override on top of Fit-to-View */}
              <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg p-0.5 border border-black/[0.03]">
                <Button size="icon" onClick={zoomOut} title={copy.zoom_out_title}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="px-1.5 font-mono text-[11px]">{Math.round(scale * 100)}%</span>
                <Button size="icon" onClick={zoomIn} title={copy.zoom_in_title}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  onClick={fit}
                  title={copy.zoom_fit_title}
                  className={mode === 'fit' ? 'opacity-40' : ''}
                >
                  <Maximize className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Card Desk Canvas — bounded by the shell; the card fits inside it */}
          <div
            ref={canvasRef}
            // pb-48 on mobile reserves room for the sheet's peek + toolbar
            // (their combined height) so Fit-to-View never hides behind them.
            className={`relative w-full flex-1 min-h-0 bg-neutral-200/40 dark:bg-neutral-900/40 rounded-3xl flex items-center justify-center border border-black/[0.04] dark:border-white/[0.05] overflow-hidden shadow-inner ${
              isDesktop ? 'p-8' : 'p-4 pb-48'
            }`}
          >
            <CardPreview ref={cardRef} scale={scale} />

            {/* Mobile overlay chips (ratio + tips) — no toolbar row below lg */}
            {!isDesktop && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur px-2.5 py-1 shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {ratioLabel(cardState.ratio, language)}
                </span>
                <TipsPopover />
              </div>
            )}
          </div>
        </div>
      </main>

      {!isDesktop && <MobileSheet />}

      {/* Export feedback lives in this toast region — bottom-center per spec. */}
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
