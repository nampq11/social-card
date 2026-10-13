import { useCallback, useState } from 'react';

/**
 * Onboarding persistence: one localStorage bit records whether the visitor
 * has been through the first-run flow (welcome card seen, or tour taken or
 * skipped). Refreshing must never restart onboarding — a returning visitor
 * always counts as done.
 */
export type OnboardingStatus = 'new' | 'done';

/** localStorage key persisting the onboarding status. */
export const ONBOARDING_STORAGE_KEY = 'social-card.onboarding';

function parse(raw: string | null): OnboardingStatus | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value === 'done' ? 'done' : null;
  } catch {
    return null;
  }
}

export function readOnboardingStatus(): OnboardingStatus {
  return parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) ?? 'new';
}

function writeOnboardingStatus(status: OnboardingStatus) {
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(status));
}

/**
 * First-run orchestration for the One-Screen Studio: the welcome card (opt-in
 * invitation) and the spotlight tour. Choosing either path — take the tour or
 * skip — finishes onboarding for good; the tour stays replayable from the
 * Tips popover (NN/g: easy to dismiss, easy to recall).
 */
export function useOnboarding() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => readOnboardingStatus() === 'new');
  const [isTourOpen, setIsTourOpen] = useState(false);

  const finishOnboarding = useCallback(() => {
    setIsWelcomeOpen(false);
    writeOnboardingStatus('done');
  }, []);

  const startTour = useCallback(() => {
    finishOnboarding();
    setIsTourOpen(true);
  }, [finishOnboarding]);

  const dismissWelcome = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  const endTour = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  return { isWelcomeOpen, isTourOpen, startTour, dismissWelcome, endTour };
}
