import React, { useRef } from 'react'
import type { CardState, AspectRatio, CardTheme } from '../types'
import { SegmentedControl } from './SegmentedControl'
import { useCardStore } from '../lib/card-store'
import { SAMPLE_PRESETS, STYLE_PRESETS, DEFAULT_CARD_STATE } from '../constants/presets'
import { Checkbox } from '@base-ui/react/checkbox'
import { Switch } from '@base-ui/react/switch'
import { Slider } from '@base-ui/react/slider'
import { Field } from '@base-ui/react/field'
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Sun,
  Scroll,
  Moon,
  Cloud,
  QrCode,
  User,
  Upload,
  Check,
} from 'lucide-react'
import { logDebug } from '../lib/log-debug'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
import { toast } from 'sonner'
import { clsx } from 'clsx'

// The Inspector's control groups, one component per group (GLOSSARY.md:
// the Inspector hosts every group; the Mobile Sheet re-hosts them by tab).
// Both hosts render the same sections, so a control can never drift between
// desktop and mobile.

// Data-URL avatars live in state and get re-encoded on every export; cap the
// source file so a stray photo-library original can't stall the studio.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

/** One-line Card State patch helper shared by every section. */
function useCardUpdate() {
  const patchCard = useCardStore((s) => s.patchCard)
  return <K extends keyof CardState>(key: K, value: CardState[K]) => patchCard({ [key]: value })
}

/** A preset stays "active" while every field it writes still matches the
 * card — any manual edit naturally deselects it. */
function isPresetActive<S extends Partial<CardState>>(card: CardState, state: S): boolean {
  return (Object.keys(state) as (keyof CardState)[]).every((key) => card[key] === state[key])
}

// Shared preset-button skin (the two preset families render it verbatim;
// only the base class differs per family).
const PRESET_ACTIVE_CLASS = 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] shadow-sm'
const PRESET_INACTIVE_CLASS =
  'bg-black/[0.05] text-[#424245] hover:bg-black/[0.09] dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]'

export const PresetsSection: React.FC = () => {
  const { copy } = useUiCopy()
  const data = useCardStore((s) => s.card)
  const patchCard = useCardStore((s) => s.patchCard)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
          {copy.presets_label}
        </label>
        <span className="text-[11px] text-[#86868B] dark:text-neutral-500">
          {copy.presets_badge}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_PRESETS.map((p) => {
          const active = isPresetActive(data, p.state)
          return (
            <Button
              key={p.id}
              onClick={() => patchCard(p.state)}
              aria-pressed={active}
              variant={active ? 'primary' : 'secondary'}
              size="sm"
              className={clsx(
                'text-[12px] font-medium transition',
                active ? PRESET_ACTIVE_CLASS : PRESET_INACTIVE_CLASS,
              )}
            >
              {copy[p.nameKey]}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

const HEADLINE_SIZE_MIN = 24
const HEADLINE_SIZE_MAX = 60

// Direct numeric entry beside the slider (slider for exploration, typed
// value for precision). Drafts locally and commits on blur/Enter — clamping
// on every keystroke would fight mid-typing ("5" of "50").
function HeadlineSizeInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = React.useState(String(value))
  const [seenValue, setSeenValue] = React.useState(value)
  if (seenValue !== value) {
    // Derived state during render: an external size change (slider drag,
    // preset, undo) resets the draft without an effect or remount.
    setSeenValue(value)
    setDraft(String(value))
  }
  const commit = () => {
    const parsed = Number.parseInt(draft, 10)
    const clamped = Number.isNaN(parsed)
      ? value
      : Math.min(HEADLINE_SIZE_MAX, Math.max(HEADLINE_SIZE_MIN, parsed))
    onCommit(clamped)
    setDraft(String(clamped))
  }
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
          if (e.key === 'Enter') commit()
        }}
        className="w-14 px-1.5 py-0.5 text-xs font-mono text-right rounded-md bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span>px</span>
    </span>
  )
}

export const StyleSection: React.FC = () => {
  const { copy } = useUiCopy()
  const data = useCardStore((s) => s.card)
  const update = useCardUpdate()
  const patchCard = useCardStore((s) => s.patchCard)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
          {copy.style_presets_label}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLE_PRESETS.map((p) => {
            const active = isPresetActive(data, p.state)
            return (
              <Button
                key={p.id}
                onClick={() => patchCard(p.state)}
                aria-pressed={active}
                variant={active ? 'primary' : 'secondary'}
                size="sm"
                className={clsx(
                  'justify-start font-medium text-xs',
                  active ? PRESET_ACTIVE_CLASS : PRESET_INACTIVE_CLASS,
                )}
              >
                {/* Theme dot — the one visual the label can't carry. */}
                <span
                  aria-hidden
                  className={clsx(
                    'size-2.5 shrink-0 rounded-full border',
                    p.state.theme === 'dark' && 'bg-neutral-900 border-neutral-600',
                    p.state.theme === 'white' && 'bg-white border-neutral-300',
                    p.state.theme === 'paper' && 'bg-[#FAF9F5] border-neutral-300',
                  )}
                />
                {copy[p.nameKey]}
              </Button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label id="ratio-label" className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
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

      <div className="flex flex-col gap-1.5">
        <label id="theme-label" className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
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
            { value: 'mist', label: copy.theme_mist, icon: <Cloud /> },
          ]}
        />
      </div>

      {/* One label naming TWO controls (slider + typed entry): base-ui Field
          is 1:1 label-to-control, so this row keeps aria-labelledby instead. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <label
            id="inspector-headline-size-label"
            className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]"
          >
            {copy.headline_size_label}
          </label>
          <HeadlineSizeInput
            value={data.headlineSize}
            onCommit={(n) => update('headlineSize', n)}
          />
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
          <Slider.Control className="flex w-full touch-none items-center py-1 [@media(pointer:coarse)]:py-3">
            <Slider.Track className="relative h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
              <Slider.Indicator className="absolute h-full rounded-full bg-blue-600" />
              <Slider.Thumb className="size-4 rounded-full border-2 border-blue-600 bg-white shadow-sm [@media(pointer:coarse)]:size-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40" />
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
  )
}

export const HeadlineSection: React.FC = () => {
  const { copy } = useUiCopy()
  const data = useCardStore((s) => s.card)
  const update = useCardUpdate()

  return (
    <div className="flex flex-col gap-4">
      <Field.Root className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <Field.Label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
            {copy.headline_label}
          </Field.Label>
          <button
            type="button"
            onClick={() => update('uppercaseHeadline', !data.uppercaseHeadline)}
            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/20 transition cursor-pointer"
          >
            AA {copy.uppercase_label}: {data.uppercaseHeadline ? copy.state_on : copy.state_off}
          </button>
        </div>
        <Field.Control
          id="inspector-headline"
          render={
            <textarea
              rows={2}
              value={data.headline}
              onChange={(e) => update('headline', e.target.value)}
              placeholder={copy.empty_headline_hint}
              className="w-full resize-none px-3.5 py-2.5 text-sm font-normal text-[#1D1D1F] dark:text-[#F5F5F7] rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/30 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-400"
            />
          }
        />
      </Field.Root>

      <Field.Root className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <Field.Label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
            {copy.sublines_label}
          </Field.Label>
          <span className="text-[11px] text-[#86868B] dark:text-neutral-500">
            {copy.sublines_badge}
          </span>
        </div>
        <Field.Control
          id="inspector-sublines"
          render={
            <textarea
              rows={3}
              value={data.sublines}
              onChange={(e) => update('sublines', e.target.value)}
              placeholder={copy.sublines_hint}
              className="w-full resize-none px-3.5 py-2.5 text-sm font-normal font-mono text-[#1D1D1F] dark:text-[#F5F5F7] rounded-xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/30 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-neutral-400"
            />
          }
        />
      </Field.Root>
    </div>
  )
}

export const IdentitySection: React.FC = () => {
  const { copy } = useUiCopy()
  const data = useCardStore((s) => s.card)
  const update = useCardUpdate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Clear value so re-uploading the same file still triggers onChange
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(copy.avatar_file_error)
      return
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(copy.avatar_too_large)
      return
    }

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result
      if (result) {
        update('avatarUrl', result as string)
      } else {
        logDebug('Inspector.handleAvatarUpload', `read "${file.name}" returned no data`)
        toast.error(copy.avatar_read_error)
      }
    }
    reader.onerror = () => {
      logDebug(
        'Inspector.handleAvatarUpload',
        `failed to read avatar file "${file.name}" (${file.size} bytes)`,
        reader.error,
      )
      toast.error(copy.avatar_file_error)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-neutral-500" />
        <span className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
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
        <Field.Root className="flex flex-col gap-1.5">
          <Field.Label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
            {copy.author_name_label}
          </Field.Label>
          <Field.Control
            id="inspector-author-name"
            value={data.authorName}
            onChange={(e) => update('authorName', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </Field.Root>
        <Field.Root className="flex flex-col gap-1.5">
          <Field.Label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
            {copy.author_bio_label}
          </Field.Label>
          <Field.Control
            id="inspector-author-bio"
            value={data.authorBio}
            onChange={(e) => update('authorBio', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </Field.Root>
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
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
          <div className="flex flex-col gap-2">
            <Field.Root className="flex flex-col gap-1.5">
              <Field.Label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
                {copy.qr_url_label}
              </Field.Label>
              <Field.Control
                id="inspector-qr-url"
                value={data.qrUrl}
                onChange={(e) => update('qrUrl', e.target.value)}
                placeholder="https://github.com/nampq11"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </Field.Root>
            <Field.Root className="flex flex-col gap-1.5">
              <Field.Label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
                {copy.qr_cta_label}
              </Field.Label>
              <Field.Control
                id="inspector-qr-cta"
                value={data.qrCta}
                onChange={(e) => update('qrCta', e.target.value)}
                placeholder={copy.qr_cta_placeholder}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </Field.Root>
          </div>
        )}
      </div>
    </div>
  )
}
