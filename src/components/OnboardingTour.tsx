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

interface OnboardingTourProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// The card every step renders into — one visual voice with the studio's
// frosted-glass panels. Class overrides replace the vendored defaults'
// (shadcn-token) colors via cn's tailwind-merge.
const STEP_CARD_CLASS =
  'relative z-50 w-80 rounded-2xl bg-white/95 dark:bg-[#1E1E22]/95 backdrop-blur ' +
  'border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-5 gap-3'

const STEP_TITLE_CLASS =
  'text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100'
const STEP_BODY_CLASS = 'text-xs leading-relaxed text-neutral-500 dark:text-neutral-400'

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

  return (
    <Tour open={open} onOpenChange={onOpenChange} spotlightPadding={8}>
      <TourPortal>
        <TourSpotlight className="bg-black/60" />
        <TourSpotlightRing className="rounded-2xl ring-2 ring-blue-500/70" />

        {/* Anchors are the surfaces each step talks about — the card and the
            Inspector panel itself. They are viewport-sized (ADR 0002), so the
            vendored shift corrects both axes to keep the popover on screen,
            floating over the dimmed target. */}
        <TourStep target="#social-card-node" collisionPadding={12} className={STEP_CARD_CLASS}>
          <StepContent
            title={copy.tour_step_canvas_title}
            body={copy.tour_step_canvas_body}
            copy={copy}
          />
        </TourStep>

        <TourStep
          target='[data-tour="inspector"]'
          side="bottom"
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

        <TourStep
          target='[data-tour="inspector-tabs"]'
          side="bottom"
          sideOffset={12}
          collisionPadding={12}
          className={STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_step_tabs_title}
            body={copy.tour_step_tabs_body}
            copy={copy}
          />
        </TourStep>

        <TourStep
          target='[data-tour="export"]'
          side="bottom"
          sideOffset={12}
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
      <TourArrow className="fill-white dark:fill-[#1E1E22]" />
      <TourClose
        aria-label={copy.tour_close}
        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
      />
      <TourHeader className="flex flex-col gap-1">
        <TourTitle className={STEP_TITLE_CLASS}>{title}</TourTitle>
        <TourDescription className={STEP_BODY_CLASS}>{body}</TourDescription>
      </TourHeader>
      <TourFooter className="items-center justify-between gap-2">
        <TourStepCounter className="text-[11px] font-mono text-neutral-400" />
        <div className="flex items-center gap-1.5">
          <TourPrev variant="ghost" size="sm">
            {copy.tour_prev}
          </TourPrev>
          <TourSkip variant="ghost" size="sm">
            {copy.tour_skip}
          </TourSkip>
          <TourNext variant="primary" size="sm">
            {lastLabel ?? copy.tour_next}
          </TourNext>
        </div>
      </TourFooter>
    </>
  )
}
