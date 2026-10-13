// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { copyCardToClipboard, downloadCardImage } from './lib/export';
import { dictionaries } from './lib/i18n';
import { DEFAULT_CARD_STATE } from './constants/presets';
import { renderWithUiCopy, setupCardStudioTest } from './test/card-studio';
import { toastRegion } from './test/toast-region';

// html-to-image cannot run in a jsdom DOM — the export module is the single
// mock boundary for the app-root seam.
vi.mock('./lib/export', () => ({
  copyCardToClipboard: vi.fn(async () => true),
  downloadCardImage: vi.fn(async () => undefined),
}));

setupCardStudioTest();

const renderApp = () => renderWithUiCopy(<App />);

// The card's headline h1 (the Header brand is an h1 too) — query within the
// exported card node so the assertion targets what the Card renders.
const cardHeadline = () =>
  within(document.getElementById('social-card-node')!).getByRole('heading', { level: 1 })
    .textContent;

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
    expect(within(region).getByText(dictionaries.vi.copy_processing)).toBeTruthy();

    deferred.resolve(true);
    expect(await within(region).findByText(dictionaries.vi.copy_success)).toBeTruthy();
  });

  it('copy success keeps the Copied! button flash — button state, not a toast', async () => {
    const deferred = deferredExport<boolean>();
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }));

    deferred.resolve(true);
    await within(await toastRegion()).findByText(dictionaries.vi.copy_success);
    expect(screen.getByRole('button', { name: 'Đã copy vào Clipboard!' })).toBeTruthy();
  });

  it('download flows through a toast: processing → success', async () => {
    const deferred = deferredExport<void>();
    vi.mocked(downloadCardImage).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Tải PNG/ }));

    const region = await toastRegion();
    expect(within(region).getByText(dictionaries.vi.download_processing)).toBeTruthy();

    deferred.resolve();
    expect(await within(region).findByText(dictionaries.vi.download_success)).toBeTruthy();
  });

  it('copy failure is reported as an error toast, not a silent failure', async () => {
    vi.mocked(copyCardToClipboard).mockRejectedValueOnce(new Error('clipboard unavailable'));
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }));

    expect(await within(await toastRegion()).findByText(dictionaries.vi.copy_error)).toBeTruthy();
  });

  it('toasts follow the active Interface Language', async () => {
    const deferred = deferredExport<boolean>();
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Đổi ngôn ngữ giao diện' }));
    fireEvent.click(screen.getByRole('button', { name: /Copy image/ }));

    deferred.resolve(true);
    expect(await within(await toastRegion()).findByText(dictionaries.en.copy_success)).toBeTruthy();
  });
});
