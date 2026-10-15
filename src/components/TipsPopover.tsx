import { useRef } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Info, Sparkles } from 'lucide-react'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'

interface TipsPopoverProps {
  /** Restarts the tour on demand (NN/g: easy to dismiss, easy to recall). */
  onReplayTour: () => void
}

/**
 * The posting-tips note (one per canvas toolbar). A popover keeps the tips
 * reachable without spending viewport height — ADR 0002. Also hosts the tour
 * replay so the onboarding stays recallable after the first run — the replay
 * includes the Showcase gesture steps while a Shot exists (OnboardingTour).
 */
export function TipsPopover({ onReplayTour }: TipsPopoverProps) {
  const { copy } = useUiCopy()
  // The replay button both closes this popover and opens the tour. The tour
  // dismisses on any focusin outside its card, so the popover's focus return
  // to its trigger would instantly kill the tour it just launched — veto
  // that one return; the tour focuses its own first step.
  const replayInitiatedClose = useRef(false)

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button size="icon" variant="ghost" title={copy.tips_title} aria-label={copy.tips_title}>
            <Info className="w-4 h-4 text-accent" />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8}>
          <Popover.Popup
            className="max-w-xs p-4 rounded-2xl bg-surface border border-hairline shadow-xl text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed"
            finalFocus={() => {
              if (replayInitiatedClose.current) {
                replayInitiatedClose.current = false
                return false
              }
              return true
            }}
          >
            <Popover.Title className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              {copy.tips_title}
            </Popover.Title>
            <Popover.Description>{copy.posting_tips}</Popover.Description>
            <Popover.Close
              render={
                <Button variant="ghost" size="sm" className="mt-2 -ml-1 text-accent">
                  <Sparkles />
                  <span>{copy.replay_tour}</span>
                </Button>
              }
              onClick={() => {
                replayInitiatedClose.current = true
                onReplayTour()
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
