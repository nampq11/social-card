// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toaster } from 'sonner';
import { Inspector } from './Inspector';
import { useCardStore } from '../lib/card-store';
import { toastRegion } from '../test/toast-region';
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio';

setupCardStudioTest();

// The Inspector itself renders no toast region; its error-toast assertions
// need one beside it (App mounts its own inside <App />).
const renderInspector = () => renderWithUiCopy(
  <>
    <Inspector />
    <Toaster />
  </>
);

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

  it('rejects files exceeding MAX_AVATAR_BYTES with an error toast', async () => {
    const { container } = renderInspector();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(await within(await toastRegion()).findByText(/Ảnh quá lớn/)).toBeTruthy();
  });

  it('rejects non-image files with an error toast', async () => {
    const { container } = renderInspector();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = new File(['%PDF-1.4 dummy'], 'doc.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    expect(await within(await toastRegion()).findByText(/Không thể đọc file ảnh/)).toBeTruthy();
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

  it('keeps one tab stop per control group, on the checked option', async () => {
    renderInspector();

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i });
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i });
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i });
    expect(square.getAttribute('tabindex')).toBe('0');
    expect(landscape.getAttribute('tabindex')).toBe('-1');

    // A browser press is mousedown → focus → click; jsdom's fireEvent.click
    // skips the implicit focus, and base-ui's roving tab stop follows focus,
    // so emulate the focus step to drive the composite like a real pointer.
    landscape.focus();
    fireEvent.click(landscape);

    await waitFor(() => {
      expect(landscape.getAttribute('tabindex')).toBe('0');
    });
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
});
