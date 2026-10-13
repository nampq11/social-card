// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
