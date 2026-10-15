// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingTour } from './OnboardingTour'
import { useCardStore } from '../lib/card-store'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'

setupCardStudioTest()

// The tour resolves its steps via `[data-tour]` anchors on the real shell;
// mounting stand-in anchors keeps this suite about the tour's own contract
// (navigation, skip/finish, conditional gesture steps) without rendering
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

// Arms the gesture steps' precondition: a Shot on a Showcase card.
const armShowcaseShot = () =>
  act(() => {
    useCardStore.getState().switchCardType('showcase')
    useCardStore.getState().addShot('data:image/jpeg;base64,tour')
  })

const next = () => screen.getByRole('button', { name: 'Tiếp' })
const skip = () => screen.getByRole('button', { name: 'Bỏ qua' })
const prev = () => screen.getByRole('button', { name: 'Lùi' })

describe('OnboardingTour', () => {
  it('starts at step 1 of 4 — the live preview — with prev disabled', async () => {
    renderTourWithAnchors()

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
    expect(screen.getByText('1 / 4')).toBeTruthy()
    expect(prev()).toHaveProperty('disabled', true)
  })

  it('next walks forward through the four steps', async () => {
    renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    fireEvent.click(next())
    expect(await screen.findByText('Bảng điều khiển')).toBeTruthy()
    expect(screen.getByText('2 / 4')).toBeTruthy()
    expect(prev()).toHaveProperty('disabled', false)

    fireEvent.click(next())
    expect(await screen.findByText('Đổi kiểu & định danh')).toBeTruthy()

    fireEvent.click(next())
    expect(await screen.findByText('Xuất ảnh trong 1 nhấp')).toBeTruthy()
    expect(screen.getByText('4 / 4')).toBeTruthy()
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

  it('finishing the last step closes the tour', async () => {
    const { onOpenChange } = renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    fireEvent.click(next())
    await screen.findByText('Bảng điều khiển')
    fireEvent.click(next())
    await screen.findByText('Đổi kiểu & định danh')
    fireEvent.click(next())
    await screen.findByText('Xuất ảnh trong 1 nhấp')

    // The last step's primary action reads "Xong", not "Tiếp".
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('renders nothing while closed', () => {
    renderTourWithAnchors(false)

    expect(screen.queryByText('Ảnh xem trước trực tiếp')).toBeNull()
  })
})

describe('OnboardingTour with a Shot on a Showcase card', () => {
  it('extends to six steps — the gesture steps join after the basics', async () => {
    armShowcaseShot()
    renderTourWithAnchors()

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
    expect(screen.getByText('1 / 6')).toBeTruthy()

    fireEvent.click(next())
    fireEvent.click(next())
    fireEvent.click(next())
    fireEvent.click(next())
    expect(await screen.findByText('Ảnh của bạn điều khiển được')).toBeTruthy()
    expect(screen.getByText('5 / 6')).toBeTruthy()

    fireEvent.click(next())
    expect(await screen.findByText('Chọn cách hiển thị từng ảnh')).toBeTruthy()
    expect(screen.getByText('6 / 6')).toBeTruthy()
  })

  it('the fit-override step finishes the extended tour', async () => {
    armShowcaseShot()
    const { onOpenChange } = renderTourWithAnchors()
    await screen.findByText('Ảnh xem trước trực tiếp')

    for (let step = 0; step < 5; step++) fireEvent.click(next())
    expect(await screen.findByText('Chọn cách hiển thị từng ảnh')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
