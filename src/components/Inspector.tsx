import React, { useRef } from 'react';
import type { CardState, AspectRatio, CardTheme } from '../types';
import { SegmentedControl } from './SegmentedControl';
import { useCardStore } from '../lib/card-store';
import { SAMPLE_PRESETS, DEFAULT_CARD_STATE } from '../constants/presets';
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Sun,
  Scroll,
  Moon,
  QrCode,
  User,
  Sparkles,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { logDebug } from '../lib/log-debug';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';
import { toast } from 'sonner';

// Data-URL avatars live in state and get re-encoded on every export; cap the
// source file so a stray photo-library original can't stall the studio.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const Inspector: React.FC = () => {
  const { copy } = useUiCopy();
  const data = useCardStore((s) => s.card);
  const patchCard = useCardStore((s) => s.patchCard);
  const resetCard = useCardStore((s) => s.resetCard);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof CardState>(key: K, value: CardState[K]) => {
    patchCard({ [key]: value });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear value so re-uploading the same file still triggers onChange
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(copy.avatar_file_error);
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(copy.avatar_too_large);
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result;
      if (result) {
        update('avatarUrl', result as string);
      } else {
        logDebug('Inspector.handleAvatarUpload', `read "${file.name}" returned no data`);
        toast.error(copy.avatar_read_error);
      }
    };
    reader.onerror = () => {
      logDebug(
        'Inspector.handleAvatarUpload',
        `failed to read avatar file "${file.name}" (${file.size} bytes)`,
        reader.error
      );
      toast.error(copy.avatar_file_error);
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col gap-6 p-6 rounded-3xl glass-panel shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto max-h-[calc(100vh-100px)]">
      {/* Header & Quick Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
            {copy.inspector_title}
          </h2>
        </div>
        <Button onClick={resetCard} variant="ghost" size="sm" title={copy.reset_title}>
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{copy.reset_button}</span>
        </Button>
      </div>

      {/* Preset Quick Picks */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {copy.presets_label}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PRESETS.map((p) => (
            <Button
              key={p.id}
              onClick={() => patchCard(p.state)}
              variant="secondary"
              size="sm"
            >
              {copy[p.nameKey]}
            </Button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio & Theme Controls */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {copy.ratio_label}
          </label>
          <SegmentedControl<AspectRatio>
            value={data.ratio}
            onChange={(r) => update('ratio', r)}
            className="w-full"
            options={[
              { value: '1:1', label: copy.ratio_square, icon: <Square /> },
              { value: '4:5', label: copy.ratio_portrait, icon: <RectangleVertical /> },
              { value: '16:9', label: copy.ratio_landscape, icon: <RectangleHorizontal /> },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {copy.theme_label}
          </label>
          <SegmentedControl<CardTheme>
            value={data.theme}
            onChange={(t) => update('theme', t)}
            className="w-full"
            options={[
              { value: 'paper', label: copy.theme_paper, icon: <Scroll /> },
              { value: 'white', label: copy.theme_white, icon: <Sun /> },
              { value: 'dark', label: copy.theme_dark, icon: <Moon /> },
            ]}
          />
        </div>
      </div>

      {/* Main Content Form */}
      <div className="space-y-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="inspector-headline"
              className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
            >
              {copy.headline_label}
            </label>
            <label
              htmlFor="inspector-uppercase"
              className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
            >
              <input
                id="inspector-uppercase"
                type="checkbox"
                checked={data.uppercaseHeadline}
                onChange={(e) => update('uppercaseHeadline', e.target.checked)}
                className="rounded border-neutral-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>{copy.uppercase_label}</span>
            </label>
          </div>
          <textarea
            id="inspector-headline"
            rows={2}
            value={data.headline}
            onChange={(e) => update('headline', e.target.value)}
            placeholder={copy.empty_headline_hint}
            className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-400"
          />
        </div>

        {/* Font Size Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label
              htmlFor="inspector-headline-size"
              className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
            >
              {copy.headline_size_label}
            </label>
            <span className="font-mono text-neutral-500">{data.headlineSize}px</span>
          </div>
          <input
            id="inspector-headline-size"
            type="range"
            min={24}
            max={60}
            step={1}
            value={data.headlineSize}
            onChange={(e) => update('headlineSize', Number(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inspector-sublines"
            className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
          >
            {copy.sublines_label}
          </label>
          <textarea
            id="inspector-sublines"
            rows={3}
            value={data.sublines}
            onChange={(e) => update('sublines', e.target.value)}
            placeholder={'lanphinh.com\nlanphinh.io'}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Author & Avatar Section */}
      <div className="space-y-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {copy.author_label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-12 h-12 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10 shadow-sm">
            <img
              src={data.avatarUrl}
              alt={copy.avatar_alt}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm">
              <Upload className="w-3 h-3" />
              <span>{copy.change_photo}</span>
            </Button>
            <Button
              onClick={() => update('avatarUrl', DEFAULT_CARD_STATE.avatarUrl)}
              variant="ghost"
              size="sm"
            >
              {copy.original_avatar}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="inspector-author-name" className="text-[10px] text-neutral-400 uppercase font-semibold">
              {copy.author_name_label}
            </label>
            <input
              id="inspector-author-name"
              type="text"
              value={data.authorName}
              onChange={(e) => update('authorName', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="inspector-author-bio" className="text-[10px] text-neutral-400 uppercase font-semibold">
              {copy.author_bio_label}
            </label>
            <input
              id="inspector-author-bio"
              type="text"
              value={data.authorBio}
              onChange={(e) => update('authorBio', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="space-y-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {copy.qr_label}
            </span>
          </div>
          <label htmlFor="inspector-qr-toggle" className="relative inline-flex items-center cursor-pointer">
            <input
              id="inspector-qr-toggle"
              type="checkbox"
              aria-label={copy.qr_label}
              checked={data.qrEnabled}
              onChange={(e) => update('qrEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-neutral-300 peer-focus:outline-none rounded-full peer transition-colors duration-150 ease-out peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-transform after:duration-150 after:ease-out"></div>
          </label>
        </div>

        {data.qrEnabled && (
          <div className="space-y-2">
            <div>
              <label htmlFor="inspector-qr-url" className="text-[10px] text-neutral-400 uppercase font-semibold">
                {copy.qr_url_label}
              </label>
              <input
                id="inspector-qr-url"
                type="text"
                value={data.qrUrl}
                onChange={(e) => update('qrUrl', e.target.value)}
                placeholder="https://github.com/nampq11"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="inspector-qr-cta" className="text-[10px] text-neutral-400 uppercase font-semibold">
                {copy.qr_cta_label}
              </label>
              <input
                id="inspector-qr-cta"
                type="text"
                value={data.qrCta}
                onChange={(e) => update('qrCta', e.target.value)}
                placeholder="Build Trợ lý AI cho riêng bạn!"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
