import React, { useRef, useState } from 'react'
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
import { shotFit } from '../lib/shot-fit'
import { PRESETS, STYLE_PRESETS, DEFAULT_CARD_STATE } from '../constants/presets'
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
  Plus,
  X,
} from 'lucide-react'
import { logDebug } from '../lib/log-debug'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'
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
          {shots.map((shot) => (
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
                alt={`${copy.shots_label} ${shots.indexOf(shot) + 1}`}
                className="h-full w-full object-cover object-top"
              />
              <button
                type="button"
                aria-label={copy.shots_remove_title}
                onClick={() => removeShot(shot.id)}
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
          <SegmentedControl<ShotFit>
            aria-labelledby={`shot-fit-label-${selectedShot.id}`}
            value={shotFit(selectedShot)}
            onChange={(fit) => setShotFit(selectedShot.id, fit)}
            className="w-full"
            options={[
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

      <CardStateToggle
        id="inspector-grayscale-avatar"
        label={copy.grayscale_avatar_label}
        checked={data.avatarGrayscale}
        onCheckedChange={(checked) => update('avatarGrayscale', checked)}
      />

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
            render={
              <textarea
                rows={2}
                value={data.authorBio}
                onChange={(e) => update('authorBio', e.target.value)}
                className="w-full resize-none px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            }
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
