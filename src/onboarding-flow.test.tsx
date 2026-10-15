// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { ONBOARDING_STORAGE_KEY } from './lib/onboarding'
import { useCardStore } from './lib/card-store'
import { renderWithUiCopy, setupCardStudioTest } from './test/card-studio'

// html-to-image cannot run in a jsdom DOM — the export module is the single
// mock boundary for the app-root seam (same as App.test.tsx).
vi.mock('./lib/export', () => ({
  copyCardToClipboard: vi.fn(async () => true),
  downloadCardImage: vi.fn(async () => undefined),
}))

// The shared studio setup (store isolation, cleanup, toasts) runs first; this
// hook then un-does its returning-visitor seeding so every test below starts
// as a genuine first-time visitor.
setupCardStudioTest()

beforeEach(() => {
  window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
})

const renderApp = () => renderWithUiCopy(<App />)

describe('first-run onboarding flow', () => {
  it('greets a first-time visitor, and the tour invitation opens the tour', async () => {
    renderApp()

    expect(screen.getByText('Chào mừng đến Social Card!')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Khám phá 30 giây' }))

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
  })

  it('skipping the welcome card goes straight to the studio — and never comes back', () => {
    const { unmount } = renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua, dùng ngay' }))

    expect(screen.queryByText('Chào mừng đến Social Card!')).toBeNull()
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('"done"')

    unmount()
    renderApp()
    expect(screen.queryByText('Chào mừng đến Social Card!')).toBeNull()
  })

  it('a returning visitor lands directly in the studio — no welcome, no tour', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"done"')
    renderApp()

    expect(screen.queryByText('Chào mừng đến Social Card!')).toBeNull()
    expect(screen.queryByText('Ảnh xem trước trực tiếp')).toBeNull()
  })

  it('finishing the tour marks onboarding done for the next visit', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Khám phá 30 giây' }))
    await screen.findByText('Ảnh xem trước trực tiếp')

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))

    await waitFor(() => expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('"done"'))
  })

  it('the tour stays replayable from the tips popover after the first run', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua, dùng ngay' }))

    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý đăng bài' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem lại hướng dẫn' }))

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
    // Past the popover's focus-return window: a replayed tour must stay
    // open, not flash and die to the trigger's focusin (TipsPopover vetoes
    // that one focus return).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(screen.getByText('Ảnh xem trước trực tiếp')).toBeTruthy()
  })

  it('the first Shot never auto-opens the tour; a replay then includes the gesture steps', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua, dùng ngay' }))

    act(() => {
      useCardStore.getState().switchCardType('showcase')
      useCardStore.getState().addShot('data:image/jpeg;base64,one')
    })

    // No mid-task interruption: the gesture steps wait inside the tour for
    // an explicit replay (the single-flow contract).
    expect(screen.queryByText('Ảnh của bạn điều khiển được')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý đăng bài' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem lại hướng dẫn' }))

    expect(await screen.findByText('Ảnh xem trước trực tiếp')).toBeTruthy()
    expect(screen.getByText('1 / 6')).toBeTruthy()
  })
})
