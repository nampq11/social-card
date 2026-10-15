// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingTour } from './OnboardingTour'
import { useCardStore } from '../lib/card-store'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'

setupCardStudioTest()

// The tour resolves its steps via `[data-tour]` anchors on the real shell;
// mounting stand-in anchors keeps this suite about the tour's own contract
// (navigation, skip/finish, the conditional gesture steps) without rendering
// the whole App.
function renderTourWithAnchors(open = true) {
  const onOpenChange = vi.fn()
  const view = renderWithUiCopy(
    <main>
      <div id="social-card-node" />
      <div data-testid="hero-slot" />
      <div data-tour="inspector" />
      <div data-tour="inspector-tabs" />
      <div data-tour="export" />
      <OnboardingTour open={open} onOpenChange={onOpenChange} />
    </main>,
  )
  return { onOpenChange, ...view }
}

// The factory card is a Showcase holding the demo Shot, so the tour's
// default step set is the full six (basics + gesture steps).
const walkNext = (times: number) => {
  for (let step = 0; step < times; step++)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
}

const next = () => screen.getByRole('button', { name: 'Tiếp' })
const skip = () => screen.getByRole('button', { name: 'Bỏ qua' })
const prev = () => screen.getByRole('button', { name: 'Lùi' })

describe('OnboardingTour', () => {
  it('starts at step 1 of 6 — the live preview — with prev disabled', async () => {
    renderTourWithAnchors()

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
    expect(screen.getByText('1 / 6')).toBeTruthy()
    expect(prev()).toHaveProperty('disabled', true)
  })

  it('next walks forward through the six steps', async () => {
    renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    fireEvent.click(next())
    expect(await screen.findByText('Bảng điều khiển')).toBeTruthy()
    expect(screen.getByText('2 / 6')).toBeTruthy()
    expect(prev()).toHaveProperty('disabled', false)

    fireEvent.click(next())
    expect(await screen.findByText('Đổi kiểu & định danh')).toBeTruthy()

    fireEvent.click(next())
    expect(await screen.findByText('Xuất ảnh trong 1 nhấp')).toBeTruthy()
    expect(screen.getByText('4 / 6')).toBeTruthy()

    fireEvent.click(next())
    expect(await screen.findByText('Ảnh của bạn điều khiển được')).toBeTruthy()

    fireEvent.click(next())
    expect(await screen.findByText('Chọn cách hiển thị từng ảnh')).toBeTruthy()
    expect(screen.getByText('6 / 6')).toBeTruthy()
  })

  it('prev walks back one step', async () => {
    renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    fireEvent.click(next())
    await screen.findByText('Bảng điều khiển')
    fireEvent.click(prev())

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
  })

  it('skipping mid-tour closes it', async () => {
    const { onOpenChange } = renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    fireEvent.click(skip())

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('the fit-override step finishes the tour', async () => {
    const { onOpenChange } = renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    walkNext(5)
    expect(await screen.findByText('Chọn cách hiển thị từng ảnh')).toBeTruthy()

    // The last step's primary action reads "Xong", not "Tiếp".
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('renders nothing while closed', () => {
    renderTourWithAnchors(false)

    expect(screen.queryByText('Ảnh xem trước trực tiếp')).toBeNull()
  })
})

describe('OnboardingTour without a Shot', () => {
  // A Quote card (or a cleared collage) carries no Screenshot Slot to
  // gesture on — the tour keeps to the four basics steps.
  const renderWithoutShot = (open = true) => {
    act(() => useCardStore.getState().switchCardType('quote'))
    return renderTourWithAnchors(open)
  }

  it('walks only the four basics steps', async () => {
    renderWithoutShot()

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
    expect(screen.getByText('1 / 4')).toBeTruthy()

    walkNext(3)
    expect(await screen.findByText('Xuất ảnh trong 1 nhấp')).toBeTruthy()
    expect(screen.getByText('4 / 4')).toBeTruthy()
    expect(screen.queryByText('Ảnh của bạn điều khiển được')).toBeNull()
  })

  it('the export step finishes the four-step tour', async () => {
    const { onOpenChange } = renderWithoutShot()
    await screen.findByText('Ảnh xem trước trực tiếp')

    walkNext(3)
    expect(await screen.findByText('Xuất ảnh trong 1 nhấp')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
