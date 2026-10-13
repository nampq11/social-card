// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Inspector } from './Inspector';
import { UiCopyProvider } from '../lib/i18n';
import { useCardStore } from '../lib/card-store';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useCardStore.getState().resetCard();
});

const renderInspector = () => {
  const onError = vi.fn();

  const utils = render(
    <UiCopyProvider>
      <Inspector onError={onError} />
    </UiCopyProvider>
  );

  return { ...utils, onError };
};

describe('Inspector', () => {
  it('associates inputs with their corresponding labels', () => {
    renderInspector();

    expect(screen.getByLabelText(/Tiêu đề chính/i)).not.toBeNull();
    expect(screen.getByLabelText(/In hoa/i)).not.toBeNull();
    expect(screen.getByLabelText(/Cỡ chữ tiêu đề/i)).not.toBeNull();
    expect(screen.getByLabelText(/Nội dung chi tiết/i)).not.toBeNull();
    expect(screen.getByLabelText(/^Tên$/i)).not.toBeNull();
    expect(screen.getByLabelText(/Bio \/ Chức danh/i)).not.toBeNull();
    expect(screen.getByLabelText(/Link liên kết/i)).not.toBeNull();
    expect(screen.getByLabelText(/Nội dung CTA bên cạnh QR/i)).not.toBeNull();
  });

  it('provides an accessible name for the QR toggle checkbox', () => {
    renderInspector();
    const qrToggle = screen.getByRole('checkbox', { name: /Mã QR & Kêu gọi/i });
    expect(qrToggle).not.toBeNull();
  });

  it('rejects files exceeding MAX_AVATAR_BYTES', () => {
    const { onError, container } = renderInspector();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Ảnh quá lớn')
    );
  });

  it('rejects non-image files with an error toast', () => {
    const { onError, container } = renderInspector();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = new File(['%PDF-1.4 dummy'], 'doc.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Không thể đọc file ảnh')
    );
  });

  it('resets file input value so re-selecting the same file fires change event', () => {
    const { container } = renderInspector();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const imgFile = new File(['valid-image-bytes'], 'me.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, { target: { files: [imgFile] } });
    expect(fileInput.value).toBe('');
  });
});

describe('Inspector segmented controls a11y', () => {
  it('announces ratio and theme as named radio groups with the checked option identified', () => {
    renderInspector();

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i });
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i });
    const portrait = within(ratioGroup).getByRole('radio', { name: /4:5 Dọc/i });
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i });
    expect(square.getAttribute('aria-checked')).toBe('true');
    expect(portrait.getAttribute('aria-checked')).toBe('false');
    expect(landscape.getAttribute('aria-checked')).toBe('false');

    const themeGroup = screen.getByRole('radiogroup', { name: /Màu nền/i });
    const paper = within(themeGroup).getByRole('radio', { name: /Giấy ngà/i });
    const dark = within(themeGroup).getByRole('radio', { name: /Tối OLED/i });
    expect(paper.getAttribute('aria-checked')).toBe('true');
    expect(dark.getAttribute('aria-checked')).toBe('false');
  });
});

  it('keeps one tab stop per control group, on the checked option', () => {
    renderInspector();

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i });
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i });
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i });
    expect(square.getAttribute('tabindex')).toBe('0');
    expect(landscape.getAttribute('tabindex')).toBe('-1');

    fireEvent.click(landscape);

    expect(landscape.getAttribute('tabindex')).toBe('0');
    expect(square.getAttribute('tabindex')).toBe('-1');
  });

  it('moves the selection with the arrow keys, roving focus with it', async () => {
    renderInspector();

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i });
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i });
    const portrait = within(ratioGroup).getByRole('radio', { name: /4:5 Dọc/i });
    square.focus();

    fireEvent.keyDown(square, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(document.activeElement).toBe(portrait);
      expect(portrait.getAttribute('aria-checked')).toBe('true');
    });
    expect(square.getAttribute('aria-checked')).toBe('false');
    expect(useCardStore.getState().card.ratio).toBe('4:5');
  });

  it('wraps arrow navigation around the ends of the group', async () => {
    renderInspector();

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i });
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i });
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i });
    square.focus();

    fireEvent.keyDown(square, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(document.activeElement).toBe(landscape);
      expect(landscape.getAttribute('aria-checked')).toBe('true');
    });
    expect(useCardStore.getState().card.ratio).toBe('16:9');
  });
