import React from 'react';
import { Copy, Check, Download, Layers } from 'lucide-react';

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
  return (
    <header className="sticky top-4 z-40 w-full max-w-6xl mx-auto mb-6 px-4">
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl glass-panel shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-black/[0.05] dark:border-white/[0.08]">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Social Card
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Vercel Ready
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
              Tạo ảnh chuẩn mẫu cho X, Threads & Facebook
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Copy to Clipboard (Hero action) */}
          <button
            type="button"
            onClick={onCopy}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 apple-button cursor-pointer ${
              isCopied
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>Đã copy vào Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[2]" />
                <span>Copy ảnh (Ctrl+V)</span>
              </>
            )}
          </button>

          {/* Download PNG */}
          <button
            type="button"
            onClick={onDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-800 dark:text-neutral-200 apple-button transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải PNG 2x</span>
          </button>
        </div>
      </div>
    </header>
  );
};
