import { useState, useRef } from 'react';
import type { CardState } from './types';
import { DEFAULT_CARD_STATE } from './constants/presets';
import { ratioLabel } from './constants/ratios';
import { Inspector } from './components/Inspector';
import { CardPreview } from './components/CardPreview';
import { Header } from './components/Header';
import { copyCardToClipboard, downloadCardImage } from './lib/export';
import { toFilename } from './lib/card-text';
import { logDebug } from './lib/log-debug';
import { useUiCopy } from './lib/i18n';
import { ZoomIn, ZoomOut, Info } from 'lucide-react';

export function App() {
  const { copy, language } = useUiCopy();
  const [cardState, setCardState] = useState<CardState>(DEFAULT_CARD_STATE);
  const [scale, setScale] = useState<number>(0.85);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swap the visible message without a pending auto-hide from a previous
  // message clearing this one early.
  const showStatus = (message: string) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusMessage(message);
  };

  const flashStatus = (message: string, durationMs = 3000) => {
    showStatus(message);
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), durationMs);
  };

  // Shared shell for export actions: guards re-entry, shows a progress
  // message, then runs the success path or logs the failure with a toast.
  const runExport = async (
    processingMessage: string,
    action: (card: HTMLDivElement) => Promise<void>,
    onSuccess: () => void,
    errorMessage: string
  ) => {
    const card = cardRef.current;
    if (!card || isExporting) return;
    setIsExporting(true);
    showStatus(processingMessage);

    try {
      await action(card);
      onSuccess();
    } catch (err) {
      logDebug('App.runExport', `export failed during "${processingMessage}"`, err);
      flashStatus(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () =>
    runExport(
      copy.copy_processing,
      async (card) => {
        await copyCardToClipboard(card);
      },
      () => {
        setIsCopied(true);
        flashStatus(copy.copy_success, 3500);
        setTimeout(() => setIsCopied(false), 3500);
      },
      copy.copy_error
    );

  const handleDownload = () =>
    runExport(
      copy.download_processing,
      async (card) => {
        await downloadCardImage(card, toFilename(cardState.headline));
      },
      () => flashStatus(copy.download_success),
      copy.download_error
    );

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0B0B0C] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-200">
      {/* Top Floating App Bar */}
      <Header
        onCopy={handleCopy}
        onDownload={handleDownload}
        isCopied={isCopied}
        isExporting={isExporting}
      />

      {/* Main Studio Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Left: Apple Inspector Sidebar */}
        <Inspector
          data={cardState}
          onChange={setCardState}
          onReset={() => setCardState(DEFAULT_CARD_STATE)}
          onError={(message) => flashStatus(message)}
        />

        {/* Center / Right: Live Canvas Studio */}
        <div className="flex-1 w-full flex flex-col items-center">
          {/* Canvas Viewport Toolbar */}
          <div className="w-full flex items-center justify-between px-3 py-2 mb-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{ratioLabel(cardState.ratio, language)}</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg p-0.5 border border-black/[0.03]">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
                className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded apple-button transition-colors cursor-pointer"
                title={copy.zoom_out_title}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px]">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.2, Number((s + 0.1).toFixed(2))))}
                className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded apple-button transition-colors cursor-pointer"
                title={copy.zoom_in_title}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Desk Canvas */}
          <div className="w-full min-h-[580px] bg-neutral-200/40 dark:bg-neutral-900/40 rounded-3xl p-8 flex items-center justify-center border border-black/[0.04] dark:border-white/[0.05] overflow-auto shadow-inner relative">
            <CardPreview ref={cardRef} data={cardState} scale={scale} />
          </div>

          {/* Floating Status Notification / Toast */}
          {statusMessage && (
            <div className="status-toast mt-4 px-4 py-2 rounded-full glass-panel border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-lg">
              {statusMessage}
            </div>
          )}

          {/* Social Platform Tips */}
          <div className="w-full mt-6 flex items-start gap-2.5 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] text-xs text-neutral-500 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
            <p>{copy.posting_tips}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
