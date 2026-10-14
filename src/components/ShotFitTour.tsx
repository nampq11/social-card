import { Tour, TourPortal, TourSpotlight, TourSpotlightRing, TourStep } from './ui/tour'
import { StepContent, TOUR_STEP_CARD_CLASS } from './tour-chrome'
import { useUiCopy } from '../lib/i18n'
import { useMediaQuery } from '../lib/use-media-query'

interface ShotFitTourProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Feature tour for the Screenshot Slot gestures (ADR 0006): drag pan,
 * pinch/ctrl+wheel zoom, double-click focus, and the per-shot Fit override.
 * Both anchors resolve in either Shell (GLOSSARY: Shell) — the hero slot by
 * its testid, the Inspector host by its data-tour anchor — so one step set
 * serves desktop and the mobile Bottom Sheet.
 */
export function ShotFitTour({ open, onOpenChange }: ShotFitTourProps) {
  const { copy } = useUiCopy()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Same docking rule as the first-run tour: the Inspector sits left on
  // desktop (dock right of it), and is the bottom sheet on mobile (dock
  // above it, or the sheet chrome ends up covered).
  const inspectorSide = isDesktop ? 'right' : 'top'
  const inspectorAlign = isDesktop ? 'start' : 'center'

  return (
    <Tour open={open} onOpenChange={onOpenChange} spotlightPadding={8}>
      <TourPortal>
        <TourSpotlight className="bg-black/60" />
        <TourSpotlightRing className="rounded-2xl ring-2 ring-[#0071E3] shadow-[0_0_20px_rgba(0,113,227,0.35)]" />

        {/* Step 1: the Hero Slot — the gestures live on the Shot itself. */}
        <TourStep
          target='[data-testid="hero-slot"]'
          side="bottom"
          sideOffset={14}
          collisionPadding={12}
          className={TOUR_STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_fit_slot_title}
            body={copy.tour_fit_slot_body}
            copy={copy}
          />
        </TourStep>

        {/* Step 2: the Inspector — where the per-shot Cover/Contain override
            lives (ScreenshotsSection in the Content tab). */}
        <TourStep
          target='[data-tour="inspector"]'
          side={inspectorSide}
          align={inspectorAlign}
          sideOffset={16}
          collisionPadding={12}
          className={TOUR_STEP_CARD_CLASS}
        >
          <StepContent
            title={copy.tour_fit_override_title}
            body={copy.tour_fit_override_body}
            copy={copy}
            lastLabel={copy.tour_finish}
          />
        </TourStep>
      </TourPortal>
    </Tour>
  )
}
