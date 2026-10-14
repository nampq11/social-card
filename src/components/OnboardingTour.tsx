import { Tour, TourPortal, TourSpotlight, TourSpotlightRing, TourStep } from './ui/tour'
import { StepContent, TOUR_STEP_CARD_CLASS } from './tour-chrome'
import { useUiCopy } from '../lib/i18n'
import { useMediaQuery } from '../lib/use-media-query'

interface OnboardingTourProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
          className={TOUR_STEP_CARD_CLASS}
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
          className={TOUR_STEP_CARD_CLASS}
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
          className={TOUR_STEP_CARD_CLASS}
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
          className={TOUR_STEP_CARD_CLASS}
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
