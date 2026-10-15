import React from 'react'
import {
  Copy,
  Check,
  Download,
  Layers,
  Globe,
  Undo2,
  Redo2,
  PanelLeft,
  ChevronDown,
} from 'lucide-react'
import { useUiCopy } from '../lib/i18n'
import { useCardStore } from '../lib/card-store'
import { Button } from './ui/Button'
import { RATIO_INFO, EXPORT_PIXEL_RATIO } from '../constants/ratios'
import { TipsPopover } from './TipsPopover'

interface HeaderProps {
  onCopy: () => void
  onDownload: () => void
  isCopied: boolean
  isExporting: boolean
  isDesktop?: boolean
  isInspectorCollapsed?: boolean
  onToggleInspector?: () => void
  onCycleRatio?: () => void
  onReplayTour?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onCopy,
  onDownload,
  isCopied,
  isExporting,
  isDesktop = true,
  isInspectorCollapsed = false,
  onToggleInspector,
  onCycleRatio,
  onReplayTour,
}) => {
  const { language, setLanguage, copy } = useUiCopy()
  const cardRatio = useCardStore((s) => s.card.ratio)
  const canUndo = useCardStore((s) => s.canUndo)
  const canRedo = useCardStore((s) => s.canRedo)
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)

  const ratioData = RATIO_INFO[cardRatio]

  return (
    <header className="shrink-0 z-30 mx-3 sm:mx-4 mt-[calc(0.75rem+env(safe-area-inset-top))] px-3 sm:px-3.5 py-2 rounded-2xl apple-glass flex items-center justify-between gap-2">
      {/* Left Group: Sidebar Toggle + Brand Identity */}
      <div className="flex items-center gap-2.5">
        {isDesktop && onToggleInspector && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleInspector}
              title={copy.inspector_toggle_title}
              aria-label={copy.inspector_toggle_title}
              aria-pressed={!isInspectorCollapsed}
              className={`w-8 h-8 rounded-xl transition-colors ${
                isInspectorCollapsed
                  ? 'text-ink-tertiary hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                  : 'bg-black/[0.08] dark:bg-white/[0.12] text-[#0071E3] dark:text-[#2997FF] shadow-xs'
              }`}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 hidden lg:block" />
          </>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#4F75FF] to-[#2554E8] flex items-center justify-center shadow-sm shadow-blue-500/25 text-white shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-[13px] font-semibold tracking-tight text-ink leading-none whitespace-nowrap">
                Social Card
              </h1>
              <span className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-ink-muted">
                HIG Studio
              </span>
            </div>
            <p className="text-[11px] text-ink-tertiary mt-0.5 hidden sm:block">
              {copy.header_tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Group: Aspect Ratio Pill + Tips (Desktop) */}
      {isDesktop && (
        <div className="hidden lg:flex items-center gap-2">
          {onCycleRatio && (
            <button
              type="button"
              onClick={onCycleRatio}
              title={copy.ratio_cycle_title}
              aria-label={copy.ratio_cycle_title}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] active:scale-[0.99] border border-black/[0.04] dark:border-white/[0.06] cursor-pointer transition text-xs font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_6px_#34C759] shrink-0" />
              <span className="font-medium text-ink">
                {ratioData.name} ({ratioData.width * EXPORT_PIXEL_RATIO} ×{' '}
                {ratioData.height * EXPORT_PIXEL_RATIO} px)
              </span>
              <span className="text-ink-tertiary hidden xl:inline">
                — {ratioData.platform[language]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-tertiary ml-0.5" />
            </button>
          )}
          {onReplayTour && <TipsPopover onReplayTour={onReplayTour} />}
        </div>
      )}

      {/* Right Group: Undo/Redo + Export Actions + Language */}
      <div className="flex items-center gap-2">
        {isDesktop && (
          <div className="hidden lg:flex items-center bg-black/[0.04] dark:bg-white/[0.06] p-0.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
            <Button
              onClick={undo}
              disabled={!canUndo}
              title={copy.undo_button_title}
              aria-label={copy.undo_button_title}
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-35"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={redo}
              disabled={!canRedo}
              title={copy.redo_button_title}
              aria-label={copy.redo_button_title}
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-35"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Export actions (data-tour="export") */}
        <div data-tour="export" className="flex items-center gap-1.5 sm:gap-2">
          <Button
            onClick={onCopy}
            disabled={isExporting}
            variant={isCopied ? 'success' : 'primary'}
            className="h-8 px-2.5 sm:px-3.5 rounded-xl whitespace-nowrap text-[12px] font-medium"
            aria-label={isCopied ? copy.copy_button_done : copy.copy_button}
          >
            {isCopied ? (
              <>
                <Check className="text-white stroke-[2.5]" />
                <span className="hidden sm:inline">{copy.copy_button_done}</span>
              </>
            ) : (
              <>
                <Copy className="stroke-[2]" />
                <span>{copy.copy_button}</span>
                <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-white/15 font-mono text-white/90">
                  ⌘C
                </kbd>
              </>
            )}
          </Button>

          <Button
            onClick={onDownload}
            disabled={isExporting}
            variant="secondary"
            className="h-8 px-2.5 sm:px-3 rounded-xl whitespace-nowrap text-[12px] font-medium"
            aria-label={copy.download_button}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{copy.download_button}</span>
          </Button>
        </div>

        {/* isDesktop is the real gate — `hidden lg:inline-flex` cannot win
            the cascade against the Button base's bare `inline-flex`: Tailwind
            v4 orders display utilities alphabetically, so `hidden` precedes
            (loses to) `inline-flex`. */}
        {isDesktop && (
          <Button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            title={copy.language_toggle_title}
            aria-label={copy.language_toggle_title}
            variant="secondary"
            className="h-8 px-2.5 rounded-xl text-[11px] font-semibold"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'VI' : 'EN'}</span>
          </Button>
        )}
      </div>
    </header>
  )
}
