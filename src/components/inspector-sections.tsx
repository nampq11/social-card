import React, { useEffect, useRef, useState } from 'react'
import type {
  AnnotationSide,
  CardState,
  AspectRatio,
  CardTheme,
  CardType,
  Shot,
  ShotFit,
} from '../types'
import { SegmentedControl } from './SegmentedControl'
import { MAX_SHOTS, useCardStore } from '../lib/card-store'
import { ingestScreenshot } from '../lib/shot-ingest'
import {
  PRESETS,
  STYLE_PRESETS,
  DEFAULT_CARD_STATE,
  type StylePresetState,
} from '../constants/presets'
import { CARD_THEME_STYLES } from '../constants/card-theme'
import { Checkbox } from '@base-ui/react/checkbox'
import { Switch } from '@base-ui/react/switch'
import { Slider } from '@base-ui/react/slider'
import { Field } from '@base-ui/react/field'
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  QrCode,
  Upload,
  Check,
  Plus,
  X,
} from 'lucide-react'
import { logDebug } from '../lib/log-debug'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
import { PresetCard } from './ui/PresetCard'
import { SwatchPicker } from './ui/SwatchPicker'
import { toast } from 'sonner'
import { clsx } from 'clsx'

// A checkbox that flips one boolean card-state field (e.g. bold sublines, grayscale avatar)
const CardStateToggle: React.FC<{
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}> = ({ id, label, checked, onCheckedChange }) => (
  <div className="flex items-center gap-1.5">
    <Checkbox.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="flex size-4 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#1E1E22] text-white transition-colors duration-150 ease-out hover:border-neutral-400 data-[checked]:border-blue-600 data-[checked]:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
    >
      <Checkbox.Indicator>
        <Check className="size-3" strokeWidth={3} />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <label
      htmlFor={id}
      className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
    >
      <span>{label}</span>
    </label>
  </div>
)

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

// The Card Type switcher (spec #33): the one control visible in BOTH modes —
// Quote mode's only new control. Pressing a segment calls the store's
// dedicated atomic switch action; the checked segment mirrors the Card Type.
export const CardTypeSwitcherSection: React.FC = () => {
  const { copy } = useUiCopy()
  const cardType = useCardStore((s) => s.card.cardType)
  const switchCardType = useCardStore((s) => s.switchCardType)

  return (
    <div className="flex flex-col gap-1.5">
      <label
        id="card-type-label"
        className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]"
      >
        {copy.card_type_label}
      </label>
      <SegmentedControl<CardType>
        aria-labelledby="card-type-label"
        value={cardType}
        onChange={switchCardType}
        className="w-full"
        options={[
          { value: 'quote', label: copy.card_type_quote },
          { value: 'showcase', label: copy.card_type_showcase },
        ]}
      />
    </div>
  )
}

// One Showcase Card's picked screenshots (GLOSSARY.md "Shot"): each pick goes
// through the shared ingest (normalize + re-encode) into the store; the
// thumbnail grid shows upload order — the first Shot renders in the Hero
// Slot — with a delete per Shot. Adding disables at MAX_SHOTS with the cap
// spelled out, mirroring the store's own refusal.
export const ScreenshotsSection: React.FC = () => {
  const { copy } = useUiCopy()
  // Select the array reference itself (stable while untouched); defaulting
  // inside the selector would mint a fresh [] per check and loop React's
  // store sync.
  const shots = useCardStore((s) => s.card.showcase?.shots) ?? []
  const addShot = useCardStore((s) => s.addShot)
  const removeShot = useCardStore((s) => s.removeShot)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setShotFit = useCardStore((s) => s.setShotFit)
  const clearShotFit = useCardStore((s) => s.clearShotFit)
  // The fit switcher acts on one selected thumbnail; which thumbnail the
  // user is looking at is UI-transient, so it stays out of the Card State.
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null)
  const selectedShot = shots.find((shot) => shot.id === selectedShotId)

  const handleShotPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Clear value so re-picking the same file still triggers onChange
    event.target.value = ''
    if (!file) return
    try {
      addShot(await ingestScreenshot(file))
    } catch (error) {
      logDebug(
        'ScreenshotsSection.handleShotPick',
        `failed to ingest "${file.name}" (${file.size} bytes)`,
        error,
      )
      toast.error(copy.shot_file_error)
    }
  }

  const atCap = shots.length >= MAX_SHOTS

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
          {copy.shots_label}
        </label>
        <span className="text-[11px] text-[#86868B] dark:text-neutral-500">
          {shots.length}/{MAX_SHOTS}
        </span>
      </div>

      {shots.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {shots.map((shot, index) => (
            <div
              key={shot.id}
              onClick={() => setSelectedShotId((current) => (current === shot.id ? null : shot.id))}
              className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-black/[0.08] dark:border-white/[0.1] ${
                selectedShotId === shot.id ? 'ring-2 ring-blue-600 dark:ring-blue-500' : ''
              }`}
            >
              {/* Named alt so identical thumbnails stay distinguishable to
                  screen readers; position = upload order = Hero Slot first. */}
              <img
                src={shot.dataUrl}
                alt={shotName(copy, index + 1)}
                className="h-full w-full object-cover object-top"
              />
              <button
                type="button"
                aria-label={copy.shots_remove_title}
                onClick={(event) => {
                  // Delete is not select: the click must not bubble into the
                  // thumbnail's toggle, which would point selection at the
                  // just-removed shot's id.
                  event.stopPropagation()
                  removeShot(shot.id)
                }}
                className="absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedShot && (
        <div className="flex flex-col gap-1.5">
          <label
            id={`shot-fit-label-${selectedShot.id}`}
            className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]"
          >
            {copy.shot_fit_label}
          </label>
          {/* Tự động = no override: the derived default (ADR 0006 §1). */}
          <SegmentedControl<'auto' | ShotFit>
            aria-labelledby={`shot-fit-label-${selectedShot.id}`}
            value={selectedShot.fit ?? 'auto'}
            onChange={(choice) =>
              choice === 'auto'
                ? clearShotFit(selectedShot.id)
                : setShotFit(selectedShot.id, choice)
            }
            className="w-full"
            options={[
              { value: 'auto', label: copy.shot_fit_auto },
              { value: 'cover', label: copy.shot_fit_cover },
              { value: 'contain', label: copy.shot_fit_contain },
            ]}
          />
        </div>
      )}

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={atCap}
        variant="secondary"
        size="sm"
        className="w-full"
      >
        <Plus className="w-3 h-3" />
        <span>{copy.shots_add}</span>
      </Button>
      {atCap && (
        <span className="text-[11px] text-[#86868B] dark:text-neutral-500">
          {copy.shots_cap_hint}
        </span>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleShotPick}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}

// Shots carry no name of their own; every surface names one by its upload
// order, matching the thumbnails' alt text in ScreenshotsSection.
const shotName = (copy: ReturnType<typeof useUiCopy>['copy'], position: number) =>
  `${copy.shots_label} ${position}`

// One Shot's line in the Annotations section: the Shot (named by upload
// order, like the thumbnails' alt text) beside its add affordance, which
// mirrors the store's one-annotation-per-Shot refusal by disabling.
const AnnotationAddRow: React.FC<{ shot: Shot; position: number }> = ({ shot, position }) => {
  const { copy } = useUiCopy()
  const annotated = useCardStore(
    (s) => s.card.showcase?.annotations.some((a) => a.shotId === shot.id) ?? false,
  )
  const name = shotName(copy, position)
  const addAnnotation = useCardStore((s) => s.addAnnotation)

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-xs text-[#424245] dark:text-[#A1A1A6]">{name}</span>
      <Button
        onClick={() => addAnnotation({ shotId: shot.id, text: '', side: 'left' })}
        disabled={annotated}
        aria-label={`${copy.annotations_add} · ${name}`}
        variant="secondary"
        size="sm"
      >
        <Plus className="w-3 h-3" />
        <span>{copy.annotations_add}</span>
      </Button>
    </div>
  )
}

// The Showcase Card's handwritten Annotations (GLOSSARY.md), edited list-only
// per spec #33 — no canvas selection: each row is the annotation's text, its
// target Shot, its side, and a delete. Adding is capped at one per Shot; the
// store refuses the add and the per-Shot add affordance mirrors that cap.
export const AnnotationsSection: React.FC = () => {
  const { copy } = useUiCopy()
  const shots = useCardStore((s) => s.card.showcase?.shots) ?? []
  const annotations = useCardStore((s) => s.card.showcase?.annotations) ?? []
  const updateAnnotation = useCardStore((s) => s.updateAnnotation)
  const removeAnnotation = useCardStore((s) => s.removeAnnotation)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
        {copy.annotations_label}
      </label>
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="flex flex-col gap-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] p-2"
        >
          <input
            aria-label={copy.annotations_text_label}
            value={annotation.text}
            onChange={(e) => updateAnnotation(annotation.id, { text: e.target.value })}
            placeholder={copy.annotations_text_hint}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="flex items-center gap-1.5">
            <select
              aria-label={copy.annotations_target_label}
              value={annotation.shotId}
              onChange={(e) => updateAnnotation(annotation.id, { shotId: e.target.value })}
              className="min-w-0 flex-1 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              {shots.map((shot, index) => (
                <option
                  key={shot.id}
                  value={shot.id}
                  disabled={annotations.some((a) => a.id !== annotation.id && a.shotId === shot.id)}
                >
                  {shotName(copy, index + 1)}
                </option>
              ))}
            </select>
            <select
              aria-label={copy.annotations_side_label}
              value={annotation.side}
              onChange={(e) =>
                updateAnnotation(annotation.id, { side: e.target.value as AnnotationSide })
              }
              className="px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="left">{copy.annotation_side_left}</option>
              <option value="right">{copy.annotation_side_right}</option>
              <option value="top">{copy.annotation_side_top}</option>
            </select>
            <button
              type="button"
              aria-label={copy.annotations_remove_title}
              onClick={() => removeAnnotation(annotation.id)}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      {shots.length === 0 ? (
        <span className="text-[11px] text-[#86868B] dark:text-neutral-500">
          {copy.annotations_needs_shot_hint}
        </span>
      ) : (
        <>
          {shots.map((shot, index) => (
            <AnnotationAddRow key={shot.id} shot={shot} position={index + 1} />
          ))}
          {shots.every((shot) => annotations.some((a) => a.shotId === shot.id)) && (
            <span className="text-[11px] text-[#86868B] dark:text-neutral-500">
              {copy.annotations_cap_hint}
            </span>
          )}
        </>
      )}
    </div>
  )
}

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
        {PRESETS.map((p) => {
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

// A style preset's miniature: an abstract card mock rendered from the
// preset's own state — theme tokens paint it, the ratio sets its silhouette,
// the headline size sets the title bars' weight. Abstract bars (never real
// content) keep the preview about the style, which is all a style preset
// writes.
const PRESET_MOCK_ASPECT: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
}

const StylePresetMock: React.FC<StylePresetState> = ({
  theme,
  ratio,
  headlineSize,
  uppercaseHeadline,
}) => {
  const tokens = CARD_THEME_STYLES[theme]
  // Headline bar weight tracks the preset's headline size (34px → 3px …
  // 54px → 5px); a caps headline reads as a wider first line.
  const headlineBar = Math.max(3, Math.round(headlineSize / 12))
  return (
    <span className={clsx('flex h-16 items-center justify-center', tokens.text)}>
      <span
        aria-hidden
        className={clsx(
          'flex h-full flex-col items-start justify-center gap-1 rounded-md border p-1.5',
          PRESET_MOCK_ASPECT[ratio],
          tokens.bg,
          tokens.border,
        )}
      >
        <span
          className={clsx('rounded-full bg-current', uppercaseHeadline ? 'w-[72%]' : 'w-[56%]')}
          style={{ height: headlineBar }}
        />
        <span
          className="w-[44%] rounded-full bg-current"
          style={{ height: Math.max(2, headlineBar - 1) }}
        />
        {/* The wide 16:9 mock is too short for subline bars — title only. */}
        {ratio !== '16:9' && (
          <>
            <span className="mt-0.5 h-[2px] w-[40%] rounded-full bg-current opacity-50" />
            <span className="h-[2px] w-[26%] rounded-full bg-current opacity-50" />
          </>
        )}
      </span>
    </span>
  )
}

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
  const isShowcase = useCardStore((s) => s.card.cardType === 'showcase')

  return (
    <div className="flex flex-col gap-4">
      {/* Style Presets write Quote-only fields, so they are hidden entirely
          in Showcase mode; the theme below stays (spec #33 story 26). */}
      {!isShowcase && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
            {copy.style_presets_label}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {STYLE_PRESETS.map((p) => (
              <PresetCard
                key={p.id}
                label={copy[p.nameKey]}
                description={copy[p.descKey]}
                active={isPresetActive(data, p.state)}
                onClick={() => patchCard(p.state)}
                preview={<StylePresetMock {...p.state} />}
              />
            ))}
          </div>
        </div>
      )}
      {/* Showcase is always 1:1 and renders no headline, so the ratio and
          headline controls would lie about what's editable; the theme stays
          (spec #33 stories 24 and 26). */}
      {!isShowcase && (
        <div className="flex flex-col gap-1.5">
          <label
            id="ratio-label"
            className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]"
          >
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
      )}

      {/* Swatches show each theme's real card color (theme tokens are the
          fill), with the caption carrying the name a color alone can't. */}
      <div className="flex flex-col gap-1.5">
        <label id="theme-label" className="text-xs font-medium text-[#424245] dark:text-[#A1A1A6]">
          {copy.theme_label}
        </label>
        <SwatchPicker<CardTheme>
          aria-labelledby="theme-label"
          value={data.theme}
          onChange={(t) => update('theme', t)}
          options={[
            { value: 'paper', label: copy.theme_paper, swatchClass: CARD_THEME_STYLES.paper.bg },
            { value: 'white', label: copy.theme_white, swatchClass: CARD_THEME_STYLES.white.bg },
            { value: 'dark', label: copy.theme_dark, swatchClass: CARD_THEME_STYLES.dark.bg },
            { value: 'mist', label: copy.theme_mist, swatchClass: CARD_THEME_STYLES.mist.bg },
          ]}
        />
      </div>

      {/* One label naming TWO controls (slider + typed entry): base-ui Field
          is 1:1 label-to-control, so this row keeps aria-labelledby instead. */}
      {!isShowcase && (
        <>
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
            {/* The A/A+ glyphs frame the slider's range at a glance — the
                typed entry above stays the precise path. */}
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="text-[10px] font-semibold text-[#86868B] dark:text-[#A1A1A6]"
              >
                A
              </span>
              <Slider.Root
                value={data.headlineSize}
                min={24}
                max={60}
                step={1}
                aria-labelledby="inspector-headline-size-label"
                onValueChange={(v) => update('headlineSize', Array.isArray(v) ? v[0] : v)}
                className="flex min-w-0 flex-1 cursor-pointer select-none"
              >
                <Slider.Control className="flex w-full touch-none items-center py-1 [@media(pointer:coarse)]:py-3">
                  <Slider.Track className="relative h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <Slider.Indicator className="absolute h-full rounded-full bg-blue-600" />
                    <Slider.Thumb className="size-4 rounded-full border-2 border-blue-600 bg-white shadow-sm [@media(pointer:coarse)]:size-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40" />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
              <span
                aria-hidden
                className="text-[13px] font-semibold text-[#86868B] dark:text-[#A1A1A6]"
              >
                A
              </span>
            </div>
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
        </>
      )}
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

      <CardStateToggle
        id="inspector-bold-sublines"
        label={copy.bold_sublines_label}
        checked={data.boldSublines}
        onCheckedChange={(checked) => update('boldSublines', checked)}
      />
    </div>
  )
}

// The Identity editor as an iOS inset-grouped list (the reference idiom):
// uppercase section micro-labels, one rounded card per group, hairline
// dividers inset past the leading icons, label-left/value-right rows, and
// iOS green switches. Values stay editable in place — the row IS the form
// field, so editing never leaves the list (grouping & mapping: a control
// sits next to what it changes).

const SECTION_LABEL_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868B] dark:text-[#A1A1A6]'

const GROUP_CARD_CLASS =
  'overflow-hidden rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-[#1E1E22] dark:border-white/[0.08]'

const IDENTITY_ROW_CLASS = 'flex items-center gap-3 px-3.5 py-2.5'

// Inset hairline (iOS): starts past the 40px leading icon + row padding, so
// dividers align with the row titles instead of cutting across the icons.
const IDENTITY_DIVIDER_CLASS = 'ml-[66px] h-px bg-black/[0.06] dark:bg-white/[0.08]'

// One iOS switch skin for both boolean identity controls (QR visibility,
// grayscale avatar) — green when on, per the iOS Settings idiom.
const IosSwitch: React.FC<{
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}> = ({ id, label, checked, onCheckedChange }) => (
  <Switch.Root
    id={id}
    aria-label={label}
    checked={checked}
    onCheckedChange={onCheckedChange}
    className="relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full bg-neutral-300 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 data-[checked]:bg-[#34C759] dark:bg-neutral-600"
  >
    <Switch.Thumb className="absolute left-[2px] top-[2px] size-[18px] rounded-full bg-white shadow transition-transform duration-200 ease-out data-[checked]:translate-x-4" />
  </Switch.Root>
)

// The QR row's tinted icon box: same 40px geometry as the avatar preview, so
// the two groups' leading edges read as one table.
const QrIconBox = () => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-black/[0.04] dark:bg-white/[0.06]">
    <QrCode className="size-5 text-[#1D1D1F] dark:text-[#F5F5F7]" strokeWidth={1.75} />
  </div>
)

// Label above a full-width editable value (iOS detail rows). Hosts the QR
// link and CTA fields that only exist while the QR is switched on.
const LabeledValueRow: React.FC<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  valueClass: string
}> = ({ id, label, value, onChange, placeholder, valueClass }) => (
  <Field.Root className="flex flex-col gap-0.5 px-3.5 py-2.5">
    <Field.Label className="text-[11px] font-medium text-[#86868B] dark:text-[#A1A1A6]">
      {label}
    </Field.Label>
    <Field.Control
      id={id}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent text-[13px] focus:outline-none ${valueClass}`}
    />
  </Field.Root>
)

export const IdentitySection: React.FC = () => {
  const { copy } = useUiCopy()
  const data = useCardStore((s) => s.card)
  const update = useCardUpdate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bioRef = useRef<HTMLTextAreaElement>(null)

  // The bio auto-grows with its content: a one-line bio is a one-line row
  // (label and value share the first line), newlines grow the row. rows=2
  // remains the fallback sizing when layout is unavailable.
  useEffect(() => {
    const bio = bioRef.current
    if (!bio) return
    // Collapsing to 0 first lets the row shrink again: scrollHeight never
    // reads below the current clientHeight, so measuring at 'auto' would
    // pin the height to the rows-attr floor.
    bio.style.height = '0'
    bio.style.height = `${bio.scrollHeight}px`
  }, [data.authorBio])

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
    <div className="flex flex-col gap-1.5">
      <span className={SECTION_LABEL_CLASS}>{copy.author_label}</span>

      {/* Author group: avatar, grayscale switch, name, bio */}
      <div className={GROUP_CARD_CLASS}>
        {/* Avatar row: the preview mirrors the card render, grayscale included */}
        <div className={IDENTITY_ROW_CLASS}>
          <div className="size-10 shrink-0 overflow-hidden rounded-[10px] ring-1 ring-black/10 dark:ring-white/15">
            <img
              src={data.avatarUrl}
              alt={copy.avatar_alt}
              className={`h-full w-full object-cover object-top ${data.avatarGrayscale ? 'grayscale' : ''}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              {copy.avatar_row_title}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-[#86868B] dark:text-[#A1A1A6]">
              {copy.avatar_row_subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-1">
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
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className={IDENTITY_DIVIDER_CLASS} />

        <div className={IDENTITY_ROW_CLASS}>
          <label
            htmlFor="inspector-grayscale-avatar"
            className="flex-1 cursor-pointer select-none text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7]"
          >
            {copy.grayscale_avatar_label}
          </label>
          <IosSwitch
            id="inspector-grayscale-avatar"
            label={copy.grayscale_avatar_label}
            checked={data.avatarGrayscale}
            onCheckedChange={(checked) => update('avatarGrayscale', checked)}
          />
        </div>

        <div className={IDENTITY_DIVIDER_CLASS} />

        {/* Name: label left, editable value right — the iOS settings row */}
        <Field.Root className={IDENTITY_ROW_CLASS}>
          <Field.Label className="shrink-0 text-[13px] text-[#1D1D1F] dark:text-[#F5F5F7]">
            {copy.author_name_label}
          </Field.Label>
          <Field.Control
            id="inspector-author-name"
            value={data.authorName}
            onChange={(e) => update('authorName', e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-right text-[13px] font-semibold text-[#1D1D1F] focus:outline-none placeholder:text-neutral-400 dark:text-[#F5F5F7]"
          />
        </Field.Root>

        <div className={IDENTITY_DIVIDER_CLASS} />

        {/* Bio: same row grammar; the multiline value stays a textarea */}
        <Field.Root className="flex items-start gap-3 px-3.5 py-2.5">
          {/* Same line-height as the textarea so the first lines share one
              baseline — the label rides the value's first line, iOS-style. */}
          <Field.Label className="shrink-0 text-[13px] leading-snug text-[#1D1D1F] dark:text-[#F5F5F7]">
            {copy.author_bio_label}
          </Field.Label>
          <Field.Control
            id="inspector-author-bio"
            render={
              <textarea
                ref={bioRef}
                rows={2}
                value={data.authorBio}
                onChange={(e) => update('authorBio', e.target.value)}
                className="min-w-0 flex-1 resize-none overflow-hidden bg-transparent py-0 text-right text-[13px] leading-snug text-[#1D1D1F] focus:outline-none placeholder:text-neutral-400 dark:text-[#F5F5F7]"
              />
            }
          />
        </Field.Root>
      </div>

      <span className={`${SECTION_LABEL_CLASS} mt-2.5`}>{copy.qr_label}</span>

      {/* QR group: the visibility switch leads the fields it controls */}
      <div className={GROUP_CARD_CLASS}>
        <div className={IDENTITY_ROW_CLASS}>
          <QrIconBox />
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[#1D1D1F] dark:text-[#F5F5F7]">
            {copy.qr_toggle_title}
          </p>
          <IosSwitch
            id="inspector-qr-toggle"
            label={copy.qr_toggle_title}
            checked={data.qrEnabled}
            onCheckedChange={(checked) => update('qrEnabled', checked)}
          />
        </div>

        {data.qrEnabled && (
          <>
            <div className={IDENTITY_DIVIDER_CLASS} />

            <LabeledValueRow
              id="inspector-qr-url"
              label={copy.qr_url_row_label}
              value={data.qrUrl}
              onChange={(value) => update('qrUrl', value)}
              placeholder="https://github.com/nampq11"
              valueClass="font-medium text-[#0071E3] placeholder:text-[#0071E3]/40 dark:text-[#6CB2FF] dark:placeholder:text-[#6CB2FF]/40"
            />

            <div className={IDENTITY_DIVIDER_CLASS} />

            <LabeledValueRow
              id="inspector-qr-cta"
              label={copy.qr_cta_label}
              value={data.qrCta}
              onChange={(value) => update('qrCta', value)}
              placeholder={copy.qr_cta_placeholder}
              valueClass="text-[#1D1D1F] placeholder:text-neutral-400 dark:text-[#F5F5F7]"
            />
          </>
        )}
      </div>
    </div>
  )
}
