// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CardPreview } from './CardPreview';
import { UiCopyProvider } from '../lib/i18n';
import { DEFAULT_CARD_STATE, FALLBACK_AUTHOR_NAME } from '../constants/presets';
import type { CardState } from '../types';

afterEach(() => {
  cleanup();
});

const renderCard = (state: Partial<CardState> = {}) => {
  const data: CardState = { ...DEFAULT_CARD_STATE, ...state };
  return render(
    <UiCopyProvider>
      <CardPreview data={data} />
    </UiCopyProvider>
  );
};

describe('CardPreview', () => {
  it('renders the card headline and sublines', () => {
    renderCard({
      headline: 'Em vừa được tậu đất:',
      sublines: 'lanphinh.com\nlanphinh.io',
    });

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe('Em vừa được tậu đất:');
    expect(screen.queryByText('lanphinh.com')).not.toBeNull();
    expect(screen.queryByText('lanphinh.io')).not.toBeNull();
  });

  it('renders fallback hint when headline is empty', () => {
    renderCard({ headline: '' });
    const h1 = screen.getByRole('heading', { level: 1 });
    // Default initial language is Vietnamese
    expect(h1.textContent).toBe('NHẬP TIÊU ĐỀ TẠI ĐÂY');
  });

  it('applies uppercase styling when uppercaseHeadline is enabled', () => {
    const { rerender } = render(
      <UiCopyProvider>
        <CardPreview data={{ ...DEFAULT_CARD_STATE, uppercaseHeadline: true }} />
      </UiCopyProvider>
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toContain('uppercase');

    rerender(
      <UiCopyProvider>
        <CardPreview data={{ ...DEFAULT_CARD_STATE, uppercaseHeadline: false }} />
      </UiCopyProvider>
    );
    expect(h1.className).not.toContain('uppercase');
  });

  it('renders author fallback when authorName is empty', () => {
    renderCard({ authorName: '' });
    expect(screen.queryByText(FALLBACK_AUTHOR_NAME)).not.toBeNull();
  });

  it('renders QR code and CTA when qrEnabled is true', () => {
    renderCard({ qrEnabled: true, qrCta: 'Quét để xem mã nguồn' });
    expect(screen.queryByText('Quét để xem mã nguồn')).not.toBeNull();
  });

  it('omits QR code and CTA when qrEnabled is false', () => {
    renderCard({ qrEnabled: false, qrCta: 'Quét để xem mã nguồn' });
    expect(screen.queryByText('Quét để xem mã nguồn')).toBeNull();
  });

  it('uses theme border on QR container without leaking ambient dark classes', () => {
    const { container } = renderCard({ qrEnabled: true, theme: 'white' });
    const qrContainer = container.querySelector('#social-card-node [data-testid="qr-container"]');
    expect(qrContainer).not.toBeNull();
    expect(qrContainer?.className).not.toContain('dark:border-white/10');
    expect(qrContainer?.className).toContain('border-black/5');
  });

  it('uses normal tracking on subline elements for optical legibility', () => {
    renderCard({ sublines: 'Testing optical tracking' });
    const line = screen.getByText('Testing optical tracking');
    expect(line.className).not.toContain('tracking-tight');
  });
});
