// @vitest-environment jsdom
import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { dictionaries } from './lib/i18n'
import { useCardStore } from './lib/card-store'
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

  it('both export buttons flow through the App toast region at bottom-center', async () => {
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: /Copy ảnh/ }))
    const region = await toastRegion()
    expect(region.getAttribute('data-y-position')).toBe('bottom')
    expect(region.getAttribute('data-x-position')).toBe('center')
    expect(await within(region).findByText(dictionaries.vi.copy_success)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Tải PNG/ }))
    expect(await within(region).findByText(dictionaries.vi.download_success)).toBeTruthy()
  })

  it('Cmd+C copies the card via global keyboard shortcut', async () => {
    renderApp()

    fireEvent.keyDown(window, { key: 'c', metaKey: true })

    expect(await within(await toastRegion()).findByText(dictionaries.vi.copy_success)).toBeTruthy()
  })

  it('Interface Language toggle updates newly added studio chrome copy', () => {
    renderApp()

    // Initial Vietnamese chrome
    expect(screen.getByRole('button', { name: dictionaries.vi.ratio_cycle_title })).toBeTruthy()
    expect(screen.getByText(dictionaries.vi.inspector_footer_layout)).toBeTruthy()
    expect(screen.getByText(dictionaries.vi.inspector_toggle_shortcut_hint)).toBeTruthy()
    expect(screen.getByText(dictionaries.vi.presets_badge)).toBeTruthy()
    expect(screen.getByText(dictionaries.vi.sublines_badge)).toBeTruthy()
    expect(
      screen.getByText(
        new RegExp(`AA ${dictionaries.vi.uppercase_label}: ${dictionaries.vi.state_on}`),
      ),
    ).toBeTruthy()

    // Toggle to English
    fireEvent.click(screen.getByRole('button', { name: dictionaries.vi.language_toggle_title }))

    expect(screen.getByRole('button', { name: dictionaries.en.ratio_cycle_title })).toBeTruthy()
    expect(screen.getByText(dictionaries.en.inspector_footer_layout)).toBeTruthy()
    expect(screen.getByText(dictionaries.en.inspector_toggle_shortcut_hint)).toBeTruthy()
    expect(screen.getByText(dictionaries.en.presets_badge)).toBeTruthy()
    expect(screen.getByText(dictionaries.en.sublines_badge)).toBeTruthy()
    expect(
      screen.getByText(
        new RegExp(`AA ${dictionaries.en.uppercase_label}: ${dictionaries.en.state_on}`),
      ),
    ).toBeTruthy()
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
    const toggleBtn = screen.getByRole('button', { name: /bảng điều khiển/ })
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(toggleBtn)
    expect(screen.queryByLabelText(/Tiêu đề chính/)).toBeNull()
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.keyDown(window, { key: '\\', ctrlKey: true })
    expect(screen.getByLabelText(/Tiêu đề chính/)).toBeTruthy()
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
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

      // Exactly one Interface Language toggle on mobile: the sheet carries
      // it on touch, so the Header's Desktop Shell copy must not render.
      expect(
        screen.getAllByRole('button', { name: dictionaries.vi.language_toggle_title }),
      ).toHaveLength(1)

      // Mobile ratio chip is rendered and cycles ratio on tap
      const mobileRatioBtn = screen.getByRole('button', {
        name: /Bấm để chuyển đổi tỷ lệ khung hình/,
      })
      expect(mobileRatioBtn.textContent).toContain('1:1 Vuông')

      fireEvent.click(mobileRatioBtn)
      expect(mobileRatioBtn.textContent).toContain('4:5 Dọc')
    } finally {
      triggerMediaQuery('(min-width: 1024px)', true)
    }
  })
  it('builds a Showcase from the Inspector onto the Card, then returns to an intact Quote', () => {
    renderApp()

    // Quote content takes a non-default value first, so the round-trip below
    // proves a Card Type switch is non-destructive.
    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Ra mắt sản phẩm:' },
    })
    expect(cardHeadline()).toBe('Ra mắt sản phẩm:')

    // Switch to Showcase through the Inspector switcher.
    const typeGroup = () => screen.getByRole('radiogroup', { name: 'Loại Card' })
    fireEvent.click(within(typeGroup()).getByRole('radio', { name: 'Giới thiệu' }))

    const cardNode = () => within(document.getElementById('social-card-node')!)
    // Showcase renders only Showcase content — no headline, no QR.
    expect(cardNode().queryByRole('heading', { level: 1 })).toBeNull()
    expect(cardNode().queryByTestId('qr-container')).toBeNull()

    // Two Shots via the store: upload order puts the first in the Hero Slot.
    act(() => {
      useCardStore.getState().addShot('data:image/jpeg;base64,first')
      useCardStore.getState().addShot('data:image/jpeg;base64,second')
    })
    expect(cardNode().getByTestId('hero-slot').querySelector('img')?.getAttribute('src')).toBe(
      'data:image/jpeg;base64,first',
    )
    const detailSlots = cardNode().getAllByTestId('detail-slot')
    expect(detailSlots).toHaveLength(1)
    expect(detailSlots[0].querySelector('img')?.getAttribute('src')).toBe(
      'data:image/jpeg;base64,second',
    )

    // The annotation is added through the Inspector and lands in its Shot's
    // slot margin on the Card.
    fireEvent.click(screen.getByRole('button', { name: 'Thêm ghi chú · Ảnh chụp màn hình 1' }))
    fireEvent.change(screen.getByLabelText('Nội dung ghi chú'), {
      target: { value: 'Tổng quan ý tưởng' },
    })
    const mark = cardNode().getByText('Tổng quan ý tưởng').closest('[data-testid="annotation"]')
    expect(cardNode().getByTestId('hero-slot').contains(mark)).toBe(true)
    expect(mark?.querySelector('[data-testid="annotation-curve"]')).not.toBeNull()

    // The author footer sits under the collage.
    expect(
      within(cardNode().getByTestId('card-footer')).getByText(DEFAULT_CARD_STATE.authorName),
    ).toBeTruthy()

    // Back to Quote: the headline survived and no Showcase DOM remains.
    fireEvent.click(within(typeGroup()).getByRole('radio', { name: 'Trích dẫn' }))
    expect(cardHeadline()).toBe('Ra mắt sản phẩm:')
    expect(cardNode().queryByTestId('shot-collage')).toBeNull()
    expect(cardNode().queryByTestId('annotation')).toBeNull()
  })
})
