// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { UiCopyProvider } from './lib/i18n';
import { useCardStore } from './lib/card-store';
import { DEFAULT_CARD_STATE } from './constants/presets';

// html-to-image cannot run in a jsdom DOM — the export module is the single
// mock boundary for the app-root seam.
vi.mock('./lib/export', () => ({
  copyCardToClipboard: vi.fn(),
  downloadCardImage: vi.fn(),
}));

beforeEach(() => {
  useCardStore.getState().resetCard();
});

afterEach(() => {
  cleanup();
});

const renderApp = () =>
  render(
    <UiCopyProvider>
      <App />
    </UiCopyProvider>
  );

// The card's headline h1 (the Header brand is an h1 too) — query within the
// exported card node so the assertion targets what the Card renders.
const cardHeadline = () =>
  within(document.getElementById('social-card-node')!).getByRole('heading', { level: 1 })
    .textContent;

describe('App', () => {
  it('shows Card Content edited in the Inspector on the Card', () => {
    renderApp();

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Ship ngày mai:' },
    });

    expect(cardHeadline()).toBe('Ship ngày mai:');
  });

  it('Reset restores the default Card State on the Card', () => {
    renderApp();

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Tạm sửa vài chữ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Mặc định/ }));

    expect(cardHeadline()).toBe(DEFAULT_CARD_STATE.headline);
  });
});
