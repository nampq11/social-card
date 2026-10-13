// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingTour } from './OnboardingTour';
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio';

setupCardStudioTest();

// The tour resolves its steps via `[data-tour]` anchors on the real shell;
// mounting stand-in anchors keeps this suite about the tour's own contract
// (4 steps, navigation, skip/finish) without rendering the whole App.
function renderTourWithAnchors(open = true) {
  const onOpenChange = vi.fn();
  const view = renderWithUiCopy(
    <main>
      <div id="social-card-node" />
      <div data-tour="inspector" />
      <div data-tour="inspector-tabs" />
      <div data-tour="export" />
      <OnboardingTour open={open} onOpenChange={onOpenChange} />
    </main>
  );
  return { onOpenChange, ...view };
}

const next = () => screen.getByRole('button', { name: 'Tiếp' });
const skip = () => screen.getByRole('button', { name: 'Bỏ qua' });
const prev = () => screen.getByRole('button', { name: 'Lùi' });

describe('OnboardingTour', () => {
  it('starts at step 1 of 4 — the live preview — with prev disabled', async () => {
    renderTourWithAnchors();

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy();
    expect(screen.getByText('1 / 4')).toBeTruthy();
    expect(prev()).toHaveProperty('disabled', true);
  });

  it('next walks forward through the four steps', async () => {
    renderTourWithAnchors();
    await screen.findByText('Ảnh xem trước trực tiếp');

    fireEvent.click(next());
    expect(await screen.findByText('Bảng điều khiển')).toBeTruthy();
    expect(screen.getByText('2 / 4')).toBeTruthy();
    expect(prev()).toHaveProperty('disabled', false);

    fireEvent.click(next());
    expect(await screen.findByText('Đổi kiểu & định danh')).toBeTruthy();

    fireEvent.click(next());
    expect(await screen.findByText('Xuất ảnh trong 1 nhấp')).toBeTruthy();
    expect(screen.getByText('4 / 4')).toBeTruthy();
  });

  it('prev walks back one step', async () => {
    renderTourWithAnchors();
    await screen.findByText('Ảnh xem trước trực tiếp');

    fireEvent.click(next());
    await screen.findByText('Bảng điều khiển');
    fireEvent.click(prev());

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy();
  });

  it('skipping mid-tour closes it', async () => {
    const { onOpenChange } = renderTourWithAnchors();
    await screen.findByText('Ảnh xem trước trực tiếp');

    fireEvent.click(skip());

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('finishing the last step closes the tour', async () => {
    const { onOpenChange } = renderTourWithAnchors();
    await screen.findByText('Ảnh xem trước trực tiếp');

    fireEvent.click(next());
    await screen.findByText('Bảng điều khiển');
    fireEvent.click(next());
    await screen.findByText('Đổi kiểu & định danh');
    fireEvent.click(next());
    await screen.findByText('Xuất ảnh trong 1 nhấp');

    // The last step's primary action reads "Xong", not "Tiếp".
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('renders nothing while closed', () => {
    renderTourWithAnchors(false);

    expect(screen.queryByText('Ảnh xem trước trực tiếp')).toBeNull();
  });
});
