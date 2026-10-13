import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach } from 'vitest';
import { UiCopyProvider } from '../lib/i18n';
import { useCardStore } from '../lib/card-store';
import { DEFAULT_CARD_STATE } from '../constants/presets';
import { ONBOARDING_STORAGE_KEY } from '../lib/onboarding';
import './match-media';

// Shared jsdom scaffolding for studio component tests: every suite starts
// from the default Card State, unmounts after each test, and clears Sonner's
// module-global toast queue so tests stay isolated. Call once per test file.
export function setupCardStudioTest() {
  beforeEach(() => {
    // The language provider persists the chosen Interface Language to
    // localStorage, which jsdom keeps across tests in a file — clear it so
    // every suite starts in the default language regardless of order.
    window.localStorage.clear();
    // Component suites test a returning visitor: the first-run welcome card
    // (a modal) would otherwise gate every interaction. First-run behavior
    // has its own onboarding suites without this seeding.
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"done"');
    // Merge-set to factory-fresh state (state AND history). resetCard() is
    // itself an undoable edit now, so it can't serve as test isolation.
    useCardStore.setState({
      card: DEFAULT_CARD_STATE,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  });

  afterEach(() => {
    cleanup();
    // Sonner's toast queue is module-global; drop toasts so tests stay isolated.
    toast.dismiss();
  });
}

// Renders under the studio's UiCopyProvider. Suites add what the component
// under test doesn't render itself — e.g. Inspector needs a Toaster beside it
// for its error-toast assertions, while App mounts its own.
export const renderWithUiCopy = (ui: ReactElement) =>
  render(<UiCopyProvider>{ui}</UiCopyProvider>);
