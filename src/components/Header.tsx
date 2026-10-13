import React from 'react';
import { Copy, Check, Download, Layers, Globe } from 'lucide-react';
import { useUiCopy } from '../lib/i18n';
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
  return (
    <header className="shrink-0 z-40 w-full max-w-6xl mx-auto px-4 pt-4 pb-2">
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
              <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Vercel Ready
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
              {copy.header_tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons — below sm the row must fit a phone: brand text
            hides and export actions go icon-only (labels stay for readers). */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span className="hidden sm:inline">{copy.copy_button_done}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[2]" />
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
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{copy.download_button}</span>
          </Button>

          {/* Interface Language toggle (compact; provider owns persistence/sync) */}
          <Button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            title={copy.language_toggle_title}
            aria-label={copy.language_toggle_title}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'VI' : 'EN'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
