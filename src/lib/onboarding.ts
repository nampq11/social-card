import { useCallback, useEffect, useState } from 'react'

/**
 * Onboarding persistence: one localStorage bit records whether the visitor
 * has been through the first-run flow (welcome card seen, or tour taken or
 * skipped). Refreshing must never restart onboarding — a returning visitor
 * always counts as done.
 */
export type OnboardingStatus = 'new' | 'done'

/** localStorage key persisting the onboarding status. */
export const ONBOARDING_STORAGE_KEY = 'social-card.onboarding'

function parse(raw: string | null): OnboardingStatus | null {
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value === 'done' ? 'done' : null
  } catch {
    return null
  }
}

export function readOnboardingStatus(): OnboardingStatus {
  return parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) ?? 'new'
}

function writeOnboardingStatus(status: OnboardingStatus) {
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(status))
}
/** localStorage key persisting the shot-gestures tour status. */
export const SHOT_FIT_TOUR_STORAGE_KEY = 'social-card.shot-fit-tour'

export function readShotFitTourStatus(): OnboardingStatus {
  return parse(window.localStorage.getItem(SHOT_FIT_TOUR_STORAGE_KEY)) ?? 'new'
}

function writeShotFitTourStatus(status: OnboardingStatus) {
  window.localStorage.setItem(SHOT_FIT_TOUR_STORAGE_KEY, JSON.stringify(status))
}

/**
 * First-run orchestration for the One-Screen Studio: the welcome card (opt-in
 * invitation) and the spotlight tour. Choosing either path — take the tour or
 * skip — finishes onboarding for good; the tour stays replayable from the
 * Tips popover (NN/g: easy to dismiss, easy to recall).
 */
export function useOnboarding() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => readOnboardingStatus() === 'new')
  const [isTourOpen, setIsTourOpen] = useState(false)

  const finishOnboarding = useCallback(() => {
    setIsWelcomeOpen(false)
    writeOnboardingStatus('done')
  }, [])

  const startTour = useCallback(() => {
    finishOnboarding()
    setIsTourOpen(true)
  }, [finishOnboarding])

  const dismissWelcome = useCallback(() => {
    finishOnboarding()
  }, [finishOnboarding])

  const endTour = useCallback(() => {
    setIsTourOpen(false)
  }, [])

  return { isWelcomeOpen, isTourOpen, startTour, dismissWelcome, endTour }
}

/**
 * Feature tour for the Screenshot Slot gestures (ADR 0006): they fire once,
 * at the moment the gestures become usable — the first Shot on a Showcase
 * card after first-run onboarding has cleared. Either path — taken or
 * skipped — persists, so a refresh never replays it; the Tips popover is
 * the recall path (NN/g: easy to dismiss, easy to recall).
 */
export function useShotFitTour(shotArmed: boolean, onboardingDone: boolean) {
  const [isTourOpen, setIsTourOpen] = useState(false)

  useEffect(() => {
    if (!shotArmed || !onboardingDone) return
    if (readShotFitTourStatus() !== 'new') return
    // Open a frame late: nothing user-visible depends on landing in the
    // ingest commit, and the spotlight reads a settled layout.
    const raf = requestAnimationFrame(() => {
      writeShotFitTourStatus('done')
      setIsTourOpen(true)
    })
    return () => cancelAnimationFrame(raf)
  }, [shotArmed, onboardingDone])

  const endTour = useCallback(() => setIsTourOpen(false), [])
  const replayTour = useCallback(() => setIsTourOpen(true), [])

  return { isTourOpen, endTour, replayTour }
}
