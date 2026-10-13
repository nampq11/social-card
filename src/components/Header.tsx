import React from 'react';
import { Copy, Check, Download, Layers, Globe, Undo2, Redo2 } from 'lucide-react';
import { useUiCopy } from '../lib/i18n';
import { useCardStore } from '../lib/card-store';
import { Button } from './ui/Button';

interface HeaderProps {
  onCopy: () => void;
  onDownload: () => void;
  isCopied: boolean;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onCopy,
  onDownload,
  isCopied,
  isExporting,
}) => {
  const { language, setLanguage, copy } = useUiCopy();
  // Edit history lives in the Card Store like every other control host;
  // disabled flags come straight off the undo stacks.
  const canUndo = useCardStore((s) => s.canUndo);
  const canRedo = useCardStore((s) => s.canRedo);
  const undo = useCardStore((s) => s.undo);
  const redo = useCardStore((s) => s.redo);
  return (
    <header className="shrink-0 z-40 w-full max-w-6xl mx-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-2">
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl glass-panel shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-black/[0.05] dark:border-white/[0.08]">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <h1 className="hidden sm:block text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                Social Card
              </h1>
            </div>
            <p className="hidden sm:block text-xs text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
              {copy.header_tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons — below sm the row must fit a phone: brand text
            hides, export actions go icon-only (labels stay for readers), and
            edit history moves into the Mobile Sheet — pointer users keep the
            visible keyboard-shortcut affordance here from lg up. */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Undo / Redo — icon-only everywhere (history is a keyboard-first
              action; the buttons are its visible affordance). */}
          <Button
            onClick={undo}
            disabled={!canUndo}
            title={copy.undo_button_title}
            aria-label={copy.undo_button_title}
            className="hidden lg:inline-flex"
          >
            <Undo2 />
          </Button>
          <Button
            onClick={redo}
            disabled={!canRedo}
            title={copy.redo_button_title}
            aria-label={copy.redo_button_title}
            className="hidden lg:inline-flex"
          >
            <Redo2 />
          </Button>

          {/* Copy to Clipboard (Hero action) */}
          <Button
            onClick={onCopy}
            disabled={isExporting}
            variant={isCopied ? 'success' : 'primary'}
            size="lg"
            className="whitespace-nowrap"
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
                <span className="hidden sm:inline">{copy.copy_button}</span>
              </>
            )}
          </Button>

          {/* Download PNG */}
          <Button
            onClick={onDownload}
            disabled={isExporting}
            className="whitespace-nowrap"
            aria-label={copy.download_button}
          >
            <Download />
            <span className="hidden sm:inline">{copy.download_button}</span>
          </Button>

          {/* Interface Language toggle (compact; provider owns persistence/sync) */}
          <Button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            title={copy.language_toggle_title}
            aria-label={copy.language_toggle_title}
          >
            <Globe />
            <span>{language === 'vi' ? 'VI' : 'EN'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
