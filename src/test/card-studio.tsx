import type { ReactElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach } from 'vitest';
import { UiCopyProvider } from '../lib/i18n';
import { useCardStore } from '../lib/card-store';
import './match-media';

// Shared jsdom scaffolding for studio component tests: every suite starts
// from the default Card State, unmounts after each test, and clears Sonner's
// module-global toast queue so tests stay isolated. Call once per test file.
export function setupCardStudioTest() {
  beforeEach(() => {
    useCardStore.getState().resetCard();
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
