import React, { useRef } from 'react';
import type { CardState, AspectRatio, CardTheme } from '../types';
import { SegmentedControl } from './SegmentedControl';
import { useCardStore } from '../lib/card-store';
import {
  SAMPLE_PRESETS,
  STYLE_PRESETS,
  DEFAULT_CARD_STATE,
  type SamplePreset,
  type StylePreset,
  type StylePresetState,
} from '../constants/presets';
import { Checkbox } from '@base-ui/react/checkbox';
import { Switch } from '@base-ui/react/switch';
import { Slider } from '@base-ui/react/slider';
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Sun,
  Scroll,
  Moon,
  QrCode,
  User,
  Upload,
  Check,
} from 'lucide-react';
import { logDebug } from '../lib/log-debug';
import { useUiCopy } from '../lib/i18n';
import { Button } from './ui/Button';
import { toast } from 'sonner';

// The Inspector's control groups, one component per group (GLOSSARY.md:
// the Inspector hosts every group; the Mobile Sheet re-hosts them by tab).
// Both hosts render the same sections, so a control can never drift between
// desktop and mobile.

// Data-URL avatars live in state and get re-encoded on every export; cap the
// source file so a stray photo-library original can't stall the studio.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** One-line Card State patch helper shared by every section. */
function useCardUpdate() {
  const patchCard = useCardStore((s) => s.patchCard);
  return <K extends keyof CardState>(key: K, value: CardState[K]) =>
    patchCard({ [key]: value });
}

export const PresetsSection: React.FC = () => {
  const { copy } = useUiCopy();
  const data = useCardStore((s) => s.card);
  const patchCard = useCardStore((s) => s.patchCard);

  // A Preset Quick Pick is "active" while every Card Content field it sets
  // still matches — any manual edit naturally deselects it.
  const isActivePreset = (preset: SamplePreset) =>
    (Object.keys(preset.state) as (keyof CardState)[]).every(
      (key) => data[key] === preset.state[key]
    );

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {copy.presets_label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_PRESETS.map((p) => (
          <Button
            key={p.id}
            onClick={() => patchCard(p.state)}
            aria-pressed={isActivePreset(p)}
            variant={isActivePreset(p) ? 'primary' : 'secondary'}
            size="sm"
          >
            {copy[p.nameKey]}
          </Button>
        ))}
      </div>
    </div>
  );
};

const HEADLINE_SIZE_MIN = 24;
const HEADLINE_SIZE_MAX = 60;

// Direct numeric entry beside the slider (slider for exploration, typed
// value for precision). Drafts locally and commits on blur/Enter — clamping
// on every keystroke would fight mid-typing ("5" of "50").
function HeadlineSizeInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = React.useState(String(value));
  const [seenValue, setSeenValue] = React.useState(value);
  if (seenValue !== value) {
    // Derived state during render: an external size change (slider drag,
    // preset, undo) resets the draft without an effect or remount.
    setSeenValue(value);
    setDraft(String(value));
  }
  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    const clamped = Number.isNaN(parsed)
      ? value
      : Math.min(HEADLINE_SIZE_MAX, Math.max(HEADLINE_SIZE_MIN, parsed));
    onCommit(clamped);
    setDraft(String(clamped));
  };
  return (
    <span className="inline-flex items-center gap-1 font-mono text-neutral-500">
      <input
        type="number"
        min={HEADLINE_SIZE_MIN}
        max={HEADLINE_SIZE_MAX}
        aria-labelledby="inspector-headline-size-label"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
        className="w-12 px-1.5 py-0.5 text-xs font-mono text-right rounded-md bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <span>px</span>
    </span>
  );
}

export const StyleSection: React.FC = () => {
  const { copy } = useUiCopy();
  const data = useCardStore((s) => s.card);
  const update = useCardUpdate();
  const patchCard = useCardStore((s) => s.patchCard);

  // A Style Preset is "active" while the whole style quadruple still matches
  // — any manual tweak of theme/ratio/size/casing deselects it.
  const isActiveStylePreset = (preset: StylePreset) =>
    (Object.keys(preset.state) as (keyof StylePresetState)[]).every(
      (key) => data[key] === preset.state[key]
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {copy.style_presets_label}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLE_PRESETS.map((p) => {
            const active = isActiveStylePreset(p);
            return (
              <Button
                key={p.id}
                onClick={() => patchCard(p.state)}
                aria-pressed={active}
                variant={active ? 'primary' : 'secondary'}
                size="sm"
                className="justify-start"
              >
                {/* Theme dot — the one visual the label can't carry. */}
                <span
                  aria-hidden
                  className={`size-2.5 shrink-0 rounded-full border ${
                    p.state.theme === 'dark'
                      ? 'bg-neutral-900 border-neutral-600'
                      : p.state.theme === 'white'
                        ? 'bg-white border-neutral-300'
                        : 'bg-[#F5EFE0] border-neutral-300'
                  }`}
                />
                {copy[p.nameKey]}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        <label id="ratio-label" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {copy.ratio_label}
        </label>
        <SegmentedControl<AspectRatio>
          aria-labelledby="ratio-label"
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
        <label id="theme-label" className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {copy.theme_label}
        </label>
        <SegmentedControl<CardTheme>
          aria-labelledby="theme-label"
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

      {/* Font Size Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label
            id="inspector-headline-size-label"
            className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
          >
            {copy.headline_size_label}
          </label>
          <HeadlineSizeInput value={data.headlineSize} onCommit={(n) => update('headlineSize', n)} />
        </div>
        <Slider.Root
          value={data.headlineSize}
          min={24}
          max={60}
          step={1}
          aria-labelledby="inspector-headline-size-label"
          onValueChange={(v) => update('headlineSize', Array.isArray(v) ? v[0] : v)}
          className="flex w-full cursor-pointer select-none"
        >
          <Slider.Control className="flex w-full touch-none items-center py-1">
            <Slider.Track className="relative h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
              <Slider.Indicator className="absolute h-full rounded-full bg-blue-600" />
              <Slider.Thumb className="size-4 rounded-full border-2 border-blue-600 bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>

      <div className="flex items-center gap-1.5">
        <Checkbox.Root
          id="inspector-uppercase"
          checked={data.uppercaseHeadline}
          onCheckedChange={(checked) => update('uppercaseHeadline', checked)}
          className="flex size-4 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#1E1E22] text-white transition-colors duration-150 ease-out hover:border-neutral-400 data-[checked]:border-blue-600 data-[checked]:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
        >
          <Checkbox.Indicator>
            <Check className="size-3" strokeWidth={3} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label
          htmlFor="inspector-uppercase"
          className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
        >
          <span>{copy.uppercase_label}</span>
        </label>
      </div>
    </div>
  );
};

export const HeadlineSection: React.FC = () => {
  const { copy } = useUiCopy();
  const data = useCardStore((s) => s.card);
  const update = useCardUpdate();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="inspector-headline"
          className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
        >
          {copy.headline_label}
        </label>
        <textarea
          id="inspector-headline"
          rows={2}
          value={data.headline}
          onChange={(e) => update('headline', e.target.value)}
          placeholder={copy.empty_headline_hint}
          className="w-full resize-none px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-400"
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
          placeholder={copy.sublines_hint}
          className="w-full resize-none px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-400"
        />
      </div>
    </div>
  );
};

export const IdentitySection: React.FC = () => {
  const { copy } = useUiCopy();
  const data = useCardStore((s) => s.card);
  const update = useCardUpdate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-4">
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
          {data.avatarUrl !== DEFAULT_CARD_STATE.avatarUrl && (
            <Button
              onClick={() => update('avatarUrl', DEFAULT_CARD_STATE.avatarUrl)}
              variant="ghost"
              size="sm"
            >
              {copy.original_avatar}
            </Button>
          )}
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
            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {copy.qr_label}
            </span>
          </div>
          <Switch.Root
            id="inspector-qr-toggle"
            aria-label={copy.qr_label}
            checked={data.qrEnabled}
            onCheckedChange={(checked) => update('qrEnabled', checked)}
            className="relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full bg-neutral-300 dark:bg-neutral-600 transition-colors duration-150 ease-out data-[checked]:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
          >
            <Switch.Thumb className="absolute left-[2px] top-[2px] size-3.5 rounded-full bg-white shadow transition-transform duration-150 ease-out data-[checked]:translate-x-3.5" />
          </Switch.Root>
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
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
