// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { App } from './App';
import { copyCardToClipboard, downloadCardImage } from './lib/export';
import { UiCopyProvider } from './lib/i18n';
import { useCardStore } from './lib/card-store';
import { DEFAULT_CARD_STATE } from './constants/presets';
import './test/match-media';

// html-to-image cannot run in a jsdom DOM — the export module is the single
// mock boundary for the app-root seam.
vi.mock('./lib/export', () => ({
  copyCardToClipboard: vi.fn(async () => true),
  downloadCardImage: vi.fn(async () => undefined),
}));

beforeEach(() => {
  useCardStore.getState().resetCard();
});

afterEach(() => {
  cleanup();
  // Sonner's toast queue is module-global; drop toasts so tests stay isolated.
  toast.dismiss();
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

// Sonner renders toasts into this region; asserting within it verifies the
// message is a toast in the live region, not stray page text.
const toastRegionNode = () => document.querySelector<HTMLElement>('[data-sonner-toaster]');

const toastRegion = async () => {
  // Sonner defers every toast store update through a timer, so the region
  // never appears synchronously after the click that started an export.
  await waitFor(() => expect(toastRegionNode()).not.toBeNull());
  return toastRegionNode()!;
};

// Holds one export in its processing state until the test settles it — the
// promise toast's processing phase is only observable while unresolved.
const deferredExport = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

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

  it('copy flows through a bottom-center toast: processing → success', async () => {
    const deferred = deferredExport<boolean>();
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }));

    const region = await toastRegion();
    expect(region.getAttribute('data-y-position')).toBe('bottom');
    expect(region.getAttribute('data-x-position')).toBe('center');
    expect(within(region).getByText('Đang xử lý ảnh Retina...')).toBeTruthy();

    deferred.resolve(true);
    expect(
      await within(region).findByText(
        'Đã copy ảnh! Bạn có thể dán (Ctrl+V) ngay vào Threads hoặc X.'
      )
    ).toBeTruthy();
  });

  it('copy success keeps the Copied! button flash — button state, not a toast', async () => {
    const deferred = deferredExport<boolean>();
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }));

    deferred.resolve(true);
    await within(await toastRegion()).findByText(
      'Đã copy ảnh! Bạn có thể dán (Ctrl+V) ngay vào Threads hoặc X.'
    );
    expect(screen.getByRole('button', { name: 'Đã copy vào Clipboard!' })).toBeTruthy();
  });

  it('download flows through a toast: processing → success', async () => {
    const deferred = deferredExport<void>();
    vi.mocked(downloadCardImage).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Tải PNG/ }));

    const region = await toastRegion();
    expect(within(region).getByText('Đang kết xuất file PNG 2x...')).toBeTruthy();

    deferred.resolve();
    expect(await within(region).findByText('Đã tải ảnh về máy thành công!')).toBeTruthy();
  });

  it('copy failure is reported as an error toast, not a silent failure', async () => {
    vi.mocked(copyCardToClipboard).mockRejectedValueOnce(new Error('clipboard unavailable'));
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }));

    expect(
      await within(await toastRegion()).findByText(
        'Không thể copy vào clipboard. Hãy thử tải ảnh PNG!'
      )
    ).toBeTruthy();
  });

  it('toasts follow the active Interface Language', async () => {
    const deferred = deferredExport<boolean>();
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi ngôn ngữ giao diện' }));
    fireEvent.click(screen.getByRole('button', { name: /Copy image/ }));

    deferred.resolve(true);
    expect(
      await within(await toastRegion()).findByText(
        'Image copied! Paste (Ctrl+V) straight into Threads or X.'
      )
    ).toBeTruthy();
  });
});
