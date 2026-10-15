import { Tour, TourPortal, TourSpotlight, TourSpotlightRing, TourStep } from './ui/tour'
import { StepContent, TOUR_STEP_CARD_CLASS } from './tour-chrome'
import { useUiCopy } from '../lib/i18n'
import { useMediaQuery } from '../lib/use-media-query'
import { useCardStore } from '../lib/card-store'

interface OnboardingTourProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The studio's one spotlight tour (≤25 words per step — auto-tours get
 * dismissed; opt-in short ones finish). Targets are the surfaces each step
 * talks about: the rendered card (`#social-card-node`) plus `[data-tour]`
 * anchors. The same step set serves both Shells because each anchor resolves
 * to that shell's host of the same control group (GLOSSARY: Shell, Inspector).
 *
 * The two Screenshot-gesture steps (ADR 0006) join the tour only while a Shot
 * exists to gesture on — their hero-slot anchor resolves then; teaching
 * gestures over the empty dashed placeholder would point at nothing. Nothing
 * ever auto-opens this tour mid-task: the welcome card (first run) and the
 * Tips popover (recall) are the only entry points.
 */
export function OnboardingTour({ open, onOpenChange }: OnboardingTourProps) {
  const { copy } = useUiCopy()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const hasShot = useCardStore(
    (s) => s.card.cardType === 'showcase' && (s.card.showcase?.shots.length ?? 0) > 0,
  )

  // On desktop, the Inspector is on the left sidebar, so the popover docks
  // to its right side. On mobile, the Inspector is the bottom sheet, so the
  // popover MUST dock above it (side="top") — docking bottom places it
  // offscreen and covers the sheet chrome with inverted arrows.
  const inspectorSide = isDesktop ? 'right' : 'top'
  const inspectorAlign = isDesktop ? 'start' : 'center'

  return (
    <Tour
      // The step set depends on hasShot. Re-keying rebuilds the engine's
      // step registrations wholesale when it flips: mounting steps into a
      // live tour (with StrictMode's double effect run) re-registers them
      // out of order, leaving their self-indexes stale — the step renders
      // never again. A fresh Tour always registers its full set cleanly.
      key={hasShot ? 'tour-with-shots' : 'tour-basics'}
      open={open}
      onOpenChange={onOpenChange}
      spotlightPadding={8}
    >
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

        {/* Step 4: Export Actions — the last basics step; the gesture steps
            below extend the tour only while a Shot exists. */}
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
            lastLabel={hasShot ? undefined : copy.tour_finish}
          />
        </TourStep>

        {/* Step 5 (a Shot exists): the Hero Slot — the gestures live on the
            Shot itself (drag pan, pinch/ctrl+wheel zoom, double-click focus). */}
        {hasShot && (
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
        )}

        {/* Step 6 (a Shot exists): the Inspector — where the per-shot
            Cover/Contain override lives (ScreenshotsSection, Content tab). */}
        {hasShot && (
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
        )}
      </TourPortal>
    </Tour>
  )
}
