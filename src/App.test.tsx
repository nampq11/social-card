// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { copyCardToClipboard, downloadCardImage } from './lib/export'
import { dictionaries } from './lib/i18n'
import { DEFAULT_CARD_STATE } from './constants/presets'
import { renderWithUiCopy, setupCardStudioTest } from './test/card-studio'
import { toastRegion } from './test/toast-region'
import { triggerMediaQuery } from './test/match-media'

// html-to-image cannot run in a jsdom DOM — the export module is the single
// mock boundary for the app-root seam.
vi.mock('./lib/export', () => ({
  copyCardToClipboard: vi.fn(async () => true),
  downloadCardImage: vi.fn(async () => undefined),
}))

setupCardStudioTest()

const renderApp = () => renderWithUiCopy(<App />)

// The card's headline h1 (the Header brand is an h1 too) — query within the
// exported card node so the assertion targets what the Card renders.
const cardHeadline = () =>
  within(document.getElementById('social-card-node')!).getByRole('heading', { level: 1 })
    .textContent

// Holds one export in its processing state until the test settles it — the
// promise toast's processing phase is only observable while unresolved.
const deferredExport = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('App', () => {
  it('shows Card Content edited in the Inspector on the Card', () => {
    renderApp()

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Ship ngày mai:' },
    })

    expect(cardHeadline()).toBe('Ship ngày mai:')
  })

  it('Reset restores the default Card State on the Card', () => {
    renderApp()

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Tạm sửa vài chữ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Mặc định/ }))

    expect(cardHeadline()).toBe(DEFAULT_CARD_STATE.headline)
  })

  it('copy flows through a bottom-center toast: processing → success', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise)
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }))

    const region = await toastRegion()
    expect(region.getAttribute('data-y-position')).toBe('bottom')
    expect(region.getAttribute('data-x-position')).toBe('center')
    expect(within(region).getByText(dictionaries.vi.copy_processing)).toBeTruthy()

    deferred.resolve(true)
    expect(await within(region).findByText(dictionaries.vi.copy_success)).toBeTruthy()
  })

  it('copy success keeps the Copied! button flash — button state, not a toast', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise)
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }))

    deferred.resolve(true)
    await within(await toastRegion()).findByText(dictionaries.vi.copy_success)
    expect(screen.getByRole('button', { name: 'Đã copy vào Clipboard!' })).toBeTruthy()
  })

  it('download flows through a toast: processing → success', async () => {
    const deferred = deferredExport<void>()
    vi.mocked(downloadCardImage).mockReturnValueOnce(deferred.promise)
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: /Tải PNG/ }))

    const region = await toastRegion()
    expect(within(region).getByText(dictionaries.vi.download_processing)).toBeTruthy()

    deferred.resolve()
    expect(await within(region).findByText(dictionaries.vi.download_success)).toBeTruthy()
  })

  it('copy failure is reported as an error toast, not a silent failure', async () => {
    vi.mocked(copyCardToClipboard).mockRejectedValueOnce(new Error('clipboard unavailable'))
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }))

    expect(await within(await toastRegion()).findByText(dictionaries.vi.copy_error)).toBeTruthy()
  })

  it('toasts follow the active Interface Language', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise)
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Đổi ngôn ngữ giao diện' }))
    fireEvent.click(screen.getByRole('button', { name: /Copy image/ }))

    deferred.resolve(true)
    expect(await within(await toastRegion()).findByText(dictionaries.en.copy_success)).toBeTruthy()
  })

  it('editing enables Header undo; undoing restores the previous Card State', () => {
    renderApp()

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Ship ngày mai:' },
    })
    expect(cardHeadline()).toBe('Ship ngày mai:')

    fireEvent.click(screen.getByRole('button', { name: /Hoàn tác/ }))
    expect(cardHeadline()).toBe(DEFAULT_CARD_STATE.headline)

    fireEvent.click(screen.getByRole('button', { name: /Làm lại/ }))
    expect(cardHeadline()).toBe('Ship ngày mai:')
  })

  it('Cmd+Z / Cmd+Shift+Z undo and redo from the keyboard', () => {
    renderApp()

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Ship ngày mai:' },
    })
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(cardHeadline()).toBe(DEFAULT_CARD_STATE.headline)

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(cardHeadline()).toBe('Ship ngày mai:')
  })

  it('the panel toggle (button and Ctrl+\\) collapses and restores the Inspector', () => {
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: /bảng điều khiển/ }))
    expect(screen.queryByLabelText(/Tiêu đề chính/)).toBeNull()

    fireEvent.keyDown(window, { key: '\\', ctrlKey: true })
    expect(screen.getByLabelText(/Tiêu đề chính/)).toBeTruthy()
  })

  it('Ctrl+B collapses and restores the Inspector', () => {
    renderApp()

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(screen.queryByLabelText(/Tiêu đề chính/)).toBeNull()

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(screen.getByLabelText(/Tiêu đề chính/)).toBeTruthy()
  })

  it('clicking the Top Bar aspect ratio pill cycles aspect ratio', () => {
    renderApp()

    const ratioBtn = screen.getByRole('button', { name: /Bấm để chuyển đổi tỷ lệ khung hình/ })
    expect(ratioBtn.textContent).toContain('Square')

    fireEvent.click(ratioBtn)
    expect(ratioBtn.textContent).toContain('Portrait')

    fireEvent.click(ratioBtn)
    expect(ratioBtn.textContent).toContain('Landscape')

    fireEvent.click(ratioBtn)
    expect(ratioBtn.textContent).toContain('Square')
  })

  it('renders the floating Zoom HUD controls', () => {
    renderApp()

    expect(screen.getByRole('button', { name: /Thu nhỏ xem trước/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Phóng to xem trước/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Vừa khung xem trước/ })).toBeTruthy()
  })

  it('renders mobile web version with MobileSheet and responsive chip that cycles ratio', () => {
    try {
      triggerMediaQuery('(min-width: 1024px)', false)
      renderApp()

      // Desktop Zoom HUD is not rendered on mobile
      expect(screen.queryByRole('button', { name: /Thu nhỏ xem trước/ })).toBeNull()

      // Mobile sheet is rendered
      expect(screen.getByRole('button', { name: /Mở hoặc thu gọn bảng tùy chỉnh/ })).toBeTruthy()

      // Mobile ratio chip is rendered and cycles ratio on tap
      const mobileRatioBtn = screen.getByRole('button', {
        name: /Bấm để chuyển đổi tỷ lệ khung hình/,
      })
      expect(mobileRatioBtn.textContent).toContain('Square')

      fireEvent.click(mobileRatioBtn)
      expect(mobileRatioBtn.textContent).toContain('Portrait')
    } finally {
      triggerMediaQuery('(min-width: 1024px)', true)
    }
  })
})
