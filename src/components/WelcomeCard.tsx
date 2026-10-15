import { Dialog } from '@base-ui/react/dialog'
import { Sparkles } from 'lucide-react'
import { useUiCopy } from '../lib/i18n'
import { Button } from './ui/Button'

interface WelcomeCardProps {
  open: boolean
  onStartTour: () => void
  onSkip: () => void
}

/**
 * First-visit welcome card: an opt-in invitation to the tour, never an
 * auto-start (user-triggered tours finish; auto-fired ones get dismissed).
 * Either choice ends first-run onboarding for good.
 */
export function WelcomeCard({ open, onStartTour, onSkip }: WelcomeCardProps) {
  const { copy } = useUiCopy()

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onSkip()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-sheet backdrop-blur border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-7 flex flex-col items-center text-center gap-4"
          aria-describedby={undefined}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-from to-brand-to flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <Dialog.Title className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {copy.onboarding_welcome_title}
          </Dialog.Title>
          <Dialog.Description className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {copy.onboarding_welcome_body}
          </Dialog.Description>
          <div className="mt-1 flex flex-col w-full gap-2">
            <Button variant="primary" size="lg" onClick={onStartTour} className="w-full">
              {copy.onboarding_tour_cta}
            </Button>
            <Button variant="ghost" size="lg" onClick={onSkip} className="w-full">
              {copy.onboarding_skip}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
