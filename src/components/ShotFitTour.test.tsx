// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ShotFitTour } from './ShotFitTour'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'

setupCardStudioTest()

// The tour resolves its anchors on the real shell; stand-in anchors keep
// this suite about the tour's own contract (2 steps, navigation, finish)
// without rendering the whole App.
function renderTourWithAnchors(open = true) {
  const onOpenChange = vi.fn()
  const view = renderWithUiCopy(
    <main>
      <div data-testid="hero-slot" />
      <div data-tour="inspector" />
      <ShotFitTour open={open} onOpenChange={onOpenChange} />
    </main>,
  )
  return { onOpenChange, ...view }
}

const next = () => screen.getByRole('button', { name: 'Tiếp' })
const skip = () => screen.getByRole('button', { name: 'Bỏ qua' })

describe('ShotFitTour', () => {
  it('starts at step 1 of 2 — the hero slot gestures — with prev disabled', async () => {
    renderTourWithAnchors()

    expect(await screen.findByText('Ảnh của bạn điều khiển được')).toBeTruthy()
    expect(screen.getByText('1 / 2')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Lùi' })).toHaveProperty('disabled', true)
  })

  it('next reaches the Fit override step, which finishes the tour', async () => {
    const { onOpenChange } = renderTourWithAnchors()

    fireEvent.click(next())
    expect(await screen.findByText('Chọn cách hiển thị từng ảnh')).toBeTruthy()
    expect(screen.getByText('2 / 2')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('skip closes the tour', async () => {
    const { onOpenChange } = renderTourWithAnchors()
    await screen.findByText('Ảnh của bạn điều khiển được')

    fireEvent.click(skip())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
