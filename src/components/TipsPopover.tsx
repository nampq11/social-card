import { Popover } from '@base-ui/react/popover'
import { Info, Sparkles } from 'lucide-react'
import { useCardStore } from '../lib/card-store'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'

interface TipsPopoverProps {
  /** Restarts the first-run tour on demand (NN/g: easy to dismiss, easy to recall). */
  onReplayTour: () => void
  /** Restarts the shot-gestures tour; offered once a Shot exists to gesture on. */
  onReplayShotFitTour: () => void
}

/**
 * The posting-tips note (one per canvas toolbar). A popover keeps the tips
 * reachable without spending viewport height — ADR 0002. Also hosts the tour
 * replay so the onboarding stays recallable after the first run.
 */
export function TipsPopover({ onReplayTour, onReplayShotFitTour }: TipsPopoverProps) {
  const { copy } = useUiCopy()
  // The shot-gestures replay targets a Screenshot Slot; without one the
  // step has nothing to spotlight, so the entry stays hidden.
  const hasShots = useCardStore(
    (s) => s.card.cardType === 'showcase' && (s.card.showcase?.shots.length ?? 0) > 0,
  )

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button size="icon" variant="ghost" title={copy.tips_title} aria-label={copy.tips_title}>
            <Info className="w-4 h-4 text-blue-500" />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8}>
          <Popover.Popup className="max-w-xs p-4 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/[0.08] dark:border-white/[0.1] shadow-xl text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <Popover.Title className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              {copy.tips_title}
            </Popover.Title>
            <Popover.Description>{copy.posting_tips}</Popover.Description>
            <Popover.Close
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 -ml-1 text-blue-600 dark:text-blue-400"
                >
                  <Sparkles />
                  <span>{copy.replay_tour}</span>
                </Button>
              }
              onClick={onReplayTour}
            />
            {hasShots && (
              <Popover.Close
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 -ml-1 text-blue-600 dark:text-blue-400"
                  >
                    <Sparkles />
                    <span>{copy.replay_fit_tour}</span>
                  </Button>
                }
                onClick={onReplayShotFitTour}
              />
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
