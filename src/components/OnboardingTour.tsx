import {
  Tour,
  TourArrow,
  TourClose,
  TourDescription,
  TourFooter,
  TourHeader,
  TourNext,
  TourPortal,
  TourPrev,
  TourSkip,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourStepCounter,
  TourTitle,
} from './ui/tour'
import { useUiCopy } from '../lib/i18n'
import { useMediaQuery } from '../lib/use-media-query'

interface OnboardingTourProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The card every step renders into — one visual voice with the studio's
// frosted-glass panels. Class overrides replace the vendored defaults'
// (shadcn-token) colors via cn's tailwind-merge.
// max-w keeps the fixed w-80 card inside 320px-wide viewports (Fold cover,
// old SE) — 100vw minus the tour's 12px collision padding on each side.
const STEP_CARD_CLASS =
  'relative z-50 w-[320px] max-w-[calc(100vw-28px)] rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl ' +
  'border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_48px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.06)] p-4 sm:p-5 gap-3.5'

const STEP_TITLE_CLASS =
  'text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug'
const STEP_BODY_CLASS = 'text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400'

/**
 * First-run spotlight tour (4 steps, ≤25 words each — auto-tours get
 * dismissed; opt-in short ones finish). Targets are the surfaces each step
 * talks about: the rendered card (`#social-card-node`) plus `[data-tour]`
 * anchors:
 * the same step set serves both Shells because each anchor resolves to that
 * shell's host of the same control group (GLOSSARY: Shell, Inspector).
 */
export function OnboardingTour({ open, onOpenChange }: OnboardingTourProps) {
  const { copy } = useUiCopy()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // On desktop, the Inspector is on the left sidebar, so the popover docks
  // to its right side. On mobile, the Inspector is the bottom sheet, so
  // the popover MUST dock above it (side="top") — docking bottom places it
  // offscreen and covers the sheet chrome with inverted arrows.
  const inspectorSide = isDesktop ? 'right' : 'top'
  const inspectorAlign = isDesktop ? 'start' : 'center'

  return (
    <Tour open={open} onOpenChange={onOpenChange} spotlightPadding={8}>
      <TourPortal>
        <TourSpotlight className="bg-black/60" />
        <TourSpotlightRing className="rounded-2xl ring-2 ring-[#0071E3] shadow-[0_0_20px_rgba(0,113,227,0.35)]" />

        {/* Step 1: Rendered Card Preview */}
        <TourStep
          target="#social-card-node"
          side="bottom"
          sideOffset={14}
          collisionPadding={12}
          className={STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_step_canvas_title}
            body={copy.tour_step_canvas_body}
            copy={copy}
          />
        </TourStep>

        {/* Step 2: Inspector Panel / Mobile Sheet */}
        <TourStep
          target='[data-tour="inspector"]'
          side={inspectorSide}
          align={inspectorAlign}
          sideOffset={16}
          collisionPadding={12}
          className={STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_step_inspector_title}
            body={copy.tour_step_inspector_body}
            copy={copy}
          />
        </TourStep>

        {/* Step 3: Inspector Tabs / Segmented Control */}
        <TourStep
          target='[data-tour="inspector-tabs"]'
          side={inspectorSide}
          align={inspectorAlign}
          sideOffset={14}
          collisionPadding={12}
          className={STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_step_tabs_title}
            body={copy.tour_step_tabs_body}
            copy={copy}
          />
        </TourStep>

        {/* Step 4: Export Actions */}
        <TourStep
          target='[data-tour="export"]'
          side="bottom"
          align="end"
          sideOffset={14}
          collisionPadding={12}
          className={STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_step_export_title}
            body={copy.tour_step_export_body}
            copy={copy}
            lastLabel={copy.tour_finish}
          />
        </TourStep>
      </TourPortal>
    </Tour>
  )
}

/** Header + body + controls shared by every step. */
function StepContent({
  title,
  body,
  copy,
  lastLabel,
}: {
  title: string
  body: string
  copy: ReturnType<typeof useUiCopy>['copy']
  lastLabel?: string
}) {
  return (
    <>
      <TourArrow className="fill-white/95 dark:fill-[#1C1C1E]/95" />
      <TourClose
        aria-label={copy.tour_close}
        className="w-7 h-7 rounded-full border-none bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.16] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center justify-center transition cursor-pointer top-3.5 right-3.5"
      />
      <TourHeader className="flex flex-col gap-1 text-left pr-7">
        <TourTitle className={STEP_TITLE_CLASS}>{title}</TourTitle>
        <TourDescription className={STEP_BODY_CLASS}>{body}</TourDescription>
      </TourHeader>
      <TourFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.07]">
        <TourStepCounter className="text-[11px] font-medium font-mono text-neutral-400 dark:text-neutral-500" />
        <div className="flex items-center gap-1.5">
          <TourPrev
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            {copy.tour_prev}
          </TourPrev>
          <TourSkip
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition"
          >
            {copy.tour_skip}
          </TourSkip>
          <TourNext
            variant="primary"
            size="sm"
            className="h-7 px-3.5 text-xs font-medium rounded-lg bg-[#0071E3] hover:bg-[#0077ED] active:scale-95 text-white shadow-xs transition"
          >
            {lastLabel ?? copy.tour_next}
          </TourNext>
        </div>
      </TourFooter>
    </>
  )
}
