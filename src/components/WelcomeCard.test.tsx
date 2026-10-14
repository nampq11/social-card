// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WelcomeCard } from './WelcomeCard'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'

setupCardStudioTest()

// The welcome card is a controlled Dialog: its own contract is opt-in —
// either choice reports out and the parent owns what happens next.
const renderWelcome = (open: boolean) =>
  renderWithUiCopy(<WelcomeCard open={open} onStartTour={vi.fn()} onSkip={vi.fn()} />)

describe('WelcomeCard', () => {
  it('greets a first-time visitor with the tour invitation', () => {
    renderWelcome(true)

    expect(screen.getByText('Chào mừng đến Social Card!')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Khám phá 30 giây' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Bỏ qua, dùng ngay' })).toBeTruthy()
  })

  it('renders nothing for a returning visitor', () => {
    renderWelcome(false)

    expect(screen.queryByText('Chào mừng đến Social Card!')).toBeNull()
  })

  it('either choice reports out — start the tour or skip', () => {
    const onStartTour = vi.fn()
    const onSkip = vi.fn()
    renderWithUiCopy(<WelcomeCard open onStartTour={onStartTour} onSkip={onSkip} />)

    fireEvent.click(screen.getByRole('button', { name: 'Khám phá 30 giây' }))
    expect(onStartTour).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua, dùng ngay' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
