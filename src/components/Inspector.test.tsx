// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toaster } from 'sonner'
import { Inspector } from './Inspector'
import { useCardStore } from '../lib/card-store'
import { DEFAULT_CARD_STATE } from '../constants/presets'
import { toastRegion } from '../test/toast-region'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'

setupCardStudioTest()

// The Inspector itself renders no toast region; its error-toast assertions
// need one beside it (App mounts its own inside <App />).
const TAB_NAMES = { style: /Kiểu/, identity: /Định danh/ } as const
const renderInspector = (tab?: keyof typeof TAB_NAMES) => {
  const result = renderWithUiCopy(
    <>
      <Inspector />
      <Toaster />
    </>,
  )
  // Sections live behind Inspector tabs mirroring the Mobile Sheet groups;
  // tests targeting a non-default group open its tab first.
  if (tab) fireEvent.click(screen.getByRole('radio', { name: TAB_NAMES[tab] }))
  return result
}

describe('Inspector style presets', () => {
  it('applies theme, ratio, headline size and casing in one undoable step', () => {
    renderInspector('style')

    fireEvent.click(screen.getByRole('button', { name: /Áp phích/i }))

    const card = useCardStore.getState().card
    expect(card.theme).toBe('dark')
    expect(card.ratio).toBe('16:9')
    expect(card.headlineSize).toBe(54)
    expect(card.uppercaseHeadline).toBe(true)

    // The whole preset is one history step, not four.
    act(() => useCardStore.getState().undo())
    expect(useCardStore.getState().card).toEqual(DEFAULT_CARD_STATE)
  })

  it('marks the active style preset while its style still matches', () => {
    renderInspector('style')

    const billboard = screen.getByRole('button', { name: /Áp phích/i })
    expect(billboard.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(billboard)
    expect(billboard.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('Inspector', () => {
  it('hosts the same tab groups as the Mobile Sheet, one group visible at a time', () => {
    renderInspector()

    // Content (default): Presets + Headline only.
    expect(screen.getByLabelText(/Tiêu đề chính/i)).not.toBeNull()
    expect(screen.queryByRole('radiogroup', { name: /Tỉ lệ khung hình/i })).toBeNull()
    expect(screen.queryByLabelText(/^Tên$/i)).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: /Kiểu/ }))
    expect(screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i })).not.toBeNull()
    expect(screen.queryByLabelText(/Tiêu đề chính/i)).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: /Định danh/ }))
    expect(screen.getByLabelText(/^Tên$/i)).not.toBeNull()
    expect(screen.queryByRole('radiogroup', { name: /Tỉ lệ khung hình/i })).toBeNull()
  })

  it('associates Content-tab inputs with their corresponding labels', () => {
    renderInspector()

    expect(screen.getByLabelText(/Tiêu đề chính/i)).not.toBeNull()
    expect(screen.getByLabelText(/Nội dung chi tiết/i)).not.toBeNull()
  })

  it('associates Identity-tab inputs with their corresponding labels', () => {
    renderInspector('identity')

    expect(screen.getByLabelText(/^Tên$/i)).not.toBeNull()
    expect(screen.getByLabelText(/Bio \/ Chức danh/i)).not.toBeNull()
    expect(screen.getByLabelText(/Link liên kết/i)).not.toBeNull()
    expect(screen.getByLabelText(/Nội dung kêu gọi bên cạnh QR/i)).not.toBeNull()
  })

  it('offers the bio as a textarea that accepts newlines', () => {
    renderInspector('identity')
    const bio = screen.getByLabelText(/Bio \/ Chức danh/i)

    expect(bio.tagName).toBe('TEXTAREA')
    expect(bio.getAttribute('rows')).toBe('2')

    fireEvent.change(bio, { target: { value: 'Founder\nMentor' } })
    expect(useCardStore.getState().card.authorBio).toBe('Founder\nMentor')
  })

  it('provides an accessible name and state for the QR toggle switch', () => {
    renderInspector('identity')
    const qrToggle = screen.getByRole('switch', { name: /Mã QR & Kêu gọi/i })
    expect(qrToggle.getAttribute('aria-checked')).toBe('true')
  })

  it('toggles uppercase Headline through the base-ui checkbox', () => {
    renderInspector('style')
    const upper = screen.getByRole('checkbox', { name: /In hoa/i })
    expect(upper.getAttribute('aria-checked')).toBe('true')

    fireEvent.click(upper)

    expect(useCardStore.getState().card.uppercaseHeadline).toBe(false)
    expect(upper.getAttribute('aria-checked')).toBe('false')
  })

  it('toggles grayscale avatar through the checkbox beside the avatar controls', () => {
    renderInspector('identity')
    const toggle = screen.getByRole('checkbox', { name: /Avatar đen trắng/i })
    expect(toggle.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(toggle)

    expect(useCardStore.getState().card.avatarGrayscale).toBe(true)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('toggles bold sublines through the checkbox next to the sublines editor', () => {
    renderInspector()
    const toggle = screen.getByRole('checkbox', { name: /Subline đậm/i })
    expect(toggle.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(toggle)

    expect(useCardStore.getState().card.boldSublines).toBe(true)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })
  it('adjusts headline size from the slider thumb with the arrow keys', async () => {
    renderInspector('style')
    const thumb = screen.getByRole('slider', { name: /Cỡ chữ tiêu đề/i })
    expect(thumb.getAttribute('aria-valuenow')).toBe('42')

    thumb.focus()
    fireEvent.keyDown(thumb, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(useCardStore.getState().card.headlineSize).toBe(43)
    })
  })

  it('marks the matching preset active and deselects it on manual edits', () => {
    renderInspector()
    const shipAi = screen.getByRole('button', { name: /Ship dự án AI mới/i })
    expect(shipAi.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(shipAi)
    expect(shipAi.getAttribute('aria-pressed')).toBe('true')

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/i), { target: { value: 'Tự viết:' } })
    expect(shipAi.getAttribute('aria-pressed')).toBe('false')
  })

  it('offers "use original avatar" only while the avatar differs from the default', () => {
    renderInspector('identity')
    expect(screen.queryByRole('button', { name: /Dùng avatar gốc/i })).toBeNull()

    act(() => {
      useCardStore.setState({
        card: { ...useCardStore.getState().card, avatarUrl: 'data:image/png;base64,abc' },
      })
    })
    fireEvent.click(screen.getByRole('button', { name: /Dùng avatar gốc/i }))

    expect(useCardStore.getState().card.avatarUrl).toBe(DEFAULT_CARD_STATE.avatarUrl)
    expect(screen.queryByRole('button', { name: /Dùng avatar gốc/i })).toBeNull()
  })

  it('rejects files exceeding MAX_AVATAR_BYTES with an error toast', async () => {
    const { container } = renderInspector('identity')
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.png', {
      type: 'image/png',
    })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })
    expect(await within(await toastRegion()).findByText(/Ảnh quá lớn/)).toBeTruthy()
  })

  it('rejects non-image files with an error toast', async () => {
    const { container } = renderInspector('identity')
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const pdfFile = new File(['%PDF-1.4 dummy'], 'doc.pdf', {
      type: 'application/pdf',
    })

    fireEvent.change(fileInput, { target: { files: [pdfFile] } })
    expect(await within(await toastRegion()).findByText(/Không thể đọc file ảnh/)).toBeTruthy()
  })

  it('resets file input value so re-selecting the same file fires change event', () => {
    const { container } = renderInspector('identity')
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const imgFile = new File(['valid-image-bytes'], 'me.png', {
      type: 'image/png',
    })

    fireEvent.change(fileInput, { target: { files: [imgFile] } })
    expect(fileInput.value).toBe('')
  })
})

describe('Headline size numeric input', () => {
  const spinbutton = () => screen.getByRole('spinbutton', { name: /Cỡ chữ tiêu đề/i })

  it('commits a typed size on blur', () => {
    renderInspector('style')

    fireEvent.change(spinbutton(), { target: { value: '50' } })
    fireEvent.blur(spinbutton())

    expect(useCardStore.getState().card.headlineSize).toBe(50)
    expect((spinbutton() as HTMLInputElement).value).toBe('50')
  })

  it('clamps out-of-range sizes to the slider range', () => {
    renderInspector('style')

    fireEvent.change(spinbutton(), { target: { value: '99' } })
    fireEvent.blur(spinbutton())
    expect(useCardStore.getState().card.headlineSize).toBe(60)

    fireEvent.change(spinbutton(), { target: { value: '4' } })
    fireEvent.blur(spinbutton())
    expect(useCardStore.getState().card.headlineSize).toBe(24)
  })

  it('keeps the previous size when the draft is not a number', () => {
    renderInspector('style')

    fireEvent.change(spinbutton(), { target: { value: 'big' } })
    fireEvent.blur(spinbutton())

    expect(useCardStore.getState().card.headlineSize).toBe(DEFAULT_CARD_STATE.headlineSize)
    expect((spinbutton() as HTMLInputElement).value).toBe(String(DEFAULT_CARD_STATE.headlineSize))
  })

  it('follows external size changes (Style Preset applies 54)', () => {
    renderInspector('style')

    fireEvent.click(screen.getByRole('button', { name: /Áp phích/i }))

    expect((spinbutton() as HTMLInputElement).value).toBe('54')
  })
})

describe('Inspector segmented controls a11y', () => {
  it('announces ratio and theme as named radio groups with the checked option identified', () => {
    renderInspector('style')

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i })
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i })
    const portrait = within(ratioGroup).getByRole('radio', { name: /4:5 Dọc/i })
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i })
    expect(square.getAttribute('aria-checked')).toBe('true')
    expect(portrait.getAttribute('aria-checked')).toBe('false')
    expect(landscape.getAttribute('aria-checked')).toBe('false')

    const themeGroup = screen.getByRole('radiogroup', { name: /Màu nền/i })
    const paper = within(themeGroup).getByRole('radio', { name: /Giấy ngà/i })
    const dark = within(themeGroup).getByRole('radio', { name: /Tối OLED/i })
    expect(paper.getAttribute('aria-checked')).toBe('true')
    expect(dark.getAttribute('aria-checked')).toBe('false')
  })

  it('switches the theme when the fourth segment (mist) is selected', () => {
    renderInspector('style')

    const themeGroup = screen.getByRole('radiogroup', { name: /Màu nền/i })
    fireEvent.click(within(themeGroup).getByRole('radio', { name: /Sương/i }))

    expect(useCardStore.getState().card.theme).toBe('mist')
  })

  it('keeps one tab stop per control group, on the checked option', async () => {
    renderInspector('style')

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i })
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i })
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i })
    expect(square.getAttribute('tabindex')).toBe('0')
    expect(landscape.getAttribute('tabindex')).toBe('-1')

    // A browser press is mousedown → focus → click; jsdom's fireEvent.click
    // skips the implicit focus, and base-ui's roving tab stop follows focus,
    // so emulate the focus step to drive the composite like a real pointer.
    landscape.focus()
    fireEvent.click(landscape)

    await waitFor(() => {
      expect(landscape.getAttribute('tabindex')).toBe('0')
    })
    expect(square.getAttribute('tabindex')).toBe('-1')
  })

  it('moves the selection with the arrow keys, roving focus with it', async () => {
    renderInspector('style')

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i })
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i })
    const portrait = within(ratioGroup).getByRole('radio', { name: /4:5 Dọc/i })
    square.focus()

    fireEvent.keyDown(square, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(document.activeElement).toBe(portrait)
      expect(portrait.getAttribute('aria-checked')).toBe('true')
    })
    expect(square.getAttribute('aria-checked')).toBe('false')
    expect(useCardStore.getState().card.ratio).toBe('4:5')
  })

  it('wraps arrow navigation around the ends of the group', async () => {
    renderInspector('style')

    const ratioGroup = screen.getByRole('radiogroup', { name: /Tỉ lệ khung hình/i })
    const square = within(ratioGroup).getByRole('radio', { name: /1:1 Vuông/i })
    const landscape = within(ratioGroup).getByRole('radio', { name: /16:9 Ngang/i })
    square.focus()

    fireEvent.keyDown(square, { key: 'ArrowLeft' })

    await waitFor(() => {
      expect(document.activeElement).toBe(landscape)
      expect(landscape.getAttribute('aria-checked')).toBe('true')
    })
    expect(useCardStore.getState().card.ratio).toBe('16:9')
  })
})
