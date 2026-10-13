import { useState, useRef } from 'react';
import type { CardState } from './types';
import { DEFAULT_CARD_STATE } from './constants/presets';
import { Inspector } from './components/Inspector';
import { CardPreview } from './components/CardPreview';
import { Header } from './components/Header';
import { copyCardToClipboard, downloadCardImage } from './lib/export';
import { ZoomIn, ZoomOut, Info } from 'lucide-react';

export function App() {
  const [cardState, setCardState] = useState<CardState>(DEFAULT_CARD_STATE);
  const [scale, setScale] = useState<number>(0.85);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const flashStatus = (message: string, durationMs = 3000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  };

  const handleCopy = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setStatusMessage('Đang xử lý ảnh Retina...');

    try {
      await copyCardToClipboard(cardRef.current);
      setIsCopied(true);
      setStatusMessage('Đã copy ảnh! Bạn có thể dán (Ctrl+V) ngay vào Threads hoặc X.');
      setTimeout(() => {
        setIsCopied(false);
        setStatusMessage(null);
      }, 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage('Không thể copy vào clipboard. Hãy thử tải ảnh PNG!');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setStatusMessage('Đang kết xuất file PNG 2x...');

    try {
      const slug = cardState.headline
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filename = `${slug || 'social-card'}.png`;
      await downloadCardImage(cardRef.current, filename);
      setStatusMessage('Đã tải ảnh về máy thành công!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Lỗi khi tải ảnh. Vui lòng thử lại!');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

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
              <span>
                {cardState.ratio === '1:1'
                  ? 'Square (2048 × 2048 px) — Threads, X, Instagram'
                  : cardState.ratio === '4:5'
                  ? 'Portrait (1080 × 1350 px) — Tối ưu màn hình Mobile'
                  : 'Landscape (1920 × 1080 px) — X Card, Facebook Post'}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg p-0.5 border border-black/[0.03]">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
                className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded apple-button transition-colors cursor-pointer"
                title="Thu nhỏ xem trước"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px]">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.2, Number((s + 0.1).toFixed(2))))}
                className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded apple-button transition-colors cursor-pointer"
                title="Phóng to xem trước"
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
            <div className="mt-4 px-4 py-2 rounded-full glass-panel border border-black/10 dark:border-white/10 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              {statusMessage}
            </div>
          )}

          {/* Social Platform Tips */}
          <div className="w-full mt-6 flex items-start gap-2.5 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05] text-xs text-neutral-500 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
            <p>
              <strong className="text-neutral-700 dark:text-neutral-300">Gợi ý đăng bài:</strong>{' '}
              Tỉ lệ <code className="font-mono text-neutral-700 dark:text-neutral-300">1:1</code>{' '}
              và <code className="font-mono text-neutral-700 dark:text-neutral-300">4:5</code> hiển thị
              hoàn hảo nhất trên dòng thời gian di động của Threads và X. Dùng tính năng{' '}
              <strong>Copy ảnh</strong> để dán trực tiếp vào bài viết mà không cần tải và lưu file rác.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
