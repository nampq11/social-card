import React, { useRef } from 'react';
import type { CardState, AspectRatio, CardTheme } from '../types';
import { SegmentedControl } from './SegmentedControl';
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

interface InspectorProps {
  data: CardState;
  onChange: (updated: CardState) => void;
  onReset: () => void;
  onError: (message: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ data, onChange, onReset, onError }) => {
  const { copy } = useUiCopy();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof CardState>(key: K, value: CardState[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result;
      if (result) {
        update('avatarUrl', result as string);
      } else {
        logDebug('Inspector.handleAvatarUpload', `read "${file.name}" returned no data`);
        onError(copy.avatar_read_error);
      }
    };
    reader.onerror = () => {
      logDebug(
        'Inspector.handleAvatarUpload',
        `failed to read avatar file "${file.name}" (${file.size} bytes)`,
        reader.error
      );
      onError(copy.avatar_file_error);
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
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 apple-button transition-colors cursor-pointer"
          title={copy.reset_title}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{copy.reset_button}</span>
        </button>
      </div>

      {/* Preset Quick Picks */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {copy.presets_label}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onChange({ ...data, ...p.state })}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-300 border border-black/[0.04] dark:border-white/[0.06] apple-button transition-all cursor-pointer"
            >
              {p.name}
            </button>
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
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {copy.headline_label}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.uppercaseHeadline}
                onChange={(e) => update('uppercaseHeadline', e.target.checked)}
                className="rounded border-neutral-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>{copy.uppercase_label}</span>
            </label>
          </div>
          <textarea
            rows={2}
            value={data.headline}
            onChange={(e) => update('headline', e.target.value)}
            placeholder={copy.empty_headline_hint}
            className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* Font Size Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {copy.headline_size_label}
            </span>
            <span className="font-mono text-neutral-500">{data.headlineSize}px</span>
          </div>
          <input
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
          <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {copy.sublines_label}
          </label>
          <textarea
            rows={3}
            value={data.sublines}
            onChange={(e) => update('sublines', e.target.value)}
            placeholder={'lanphinh.com\nlanphinh.io'}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-400"
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] text-neutral-700 dark:text-neutral-200 apple-button transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>{copy.change_photo}</span>
            </button>
            <button
              type="button"
              onClick={() => update('avatarUrl', DEFAULT_CARD_STATE.avatarUrl)}
              className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 apple-button cursor-pointer"
            >
              {copy.original_avatar}
            </button>
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
            <label className="text-[10px] text-neutral-400 uppercase font-semibold">
              {copy.author_name_label}
            </label>
            <input
              type="text"
              value={data.authorName}
              onChange={(e) => update('authorName', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 uppercase font-semibold">
              {copy.author_bio_label}
            </label>
            <input
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
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.qrEnabled}
              onChange={(e) => update('qrEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {data.qrEnabled && (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-semibold">
                {copy.qr_url_label}
              </label>
              <input
                type="text"
                value={data.qrUrl}
                onChange={(e) => update('qrUrl', e.target.value)}
                placeholder="https://github.com/nampq11"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 uppercase font-semibold">
                {copy.qr_cta_label}
              </label>
              <input
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
