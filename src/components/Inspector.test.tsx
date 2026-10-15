// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from 'sonner'
import { Inspector } from './Inspector'
import { useCardStore } from '../lib/card-store'
import { DEFAULT_CARD_STATE } from '../constants/presets'
import type { CardState } from '../types'
import { toastRegion } from '../test/toast-region'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'
import { UI_LANGUAGE_STORAGE_KEY } from '../lib/i18n'

setupCardStudioTest()

// The studio's factory card ships as a Showcase holding the demo Shot;
// these suites pin the per-mode Inspector contracts from a Quote baseline
// (the App-level flow tests seed the same way). Its showcase nest is
// emptied so the Showcase-section tests that switch over get deterministic
// Shot counts and thumbnail ordinals.
const freshQuoteCard = (): CardState => ({
  ...DEFAULT_CARD_STATE,
  cardType: 'quote',
  showcase: { shots: [], annotations: [] },
})

beforeEach(() => {
  useCardStore.setState({ card: freshQuoteCard() })
})

// jsdom has no canvas, so the real ingest cannot run here; the seam under
// test is that a picked file goes through ingestScreenshot into the store.
vi.mock('../lib/shot-ingest', () => ({
  ingestScreenshot: vi.fn(async () => 'data:image/jpeg;base64,ingested'),
}))

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

    // The whole preset is one history step, not four — undo returns to the
    // baseline the step started from.
    act(() => useCardStore.getState().undo())
    expect(useCardStore.getState().card).toEqual(freshQuoteCard())
  })

  it('marks the active style preset while its style still matches', () => {
    renderInspector('style')

    const billboard = screen.getByRole('button', { name: /Áp phích/i })
    expect(billboard.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(billboard)
    expect(billboard.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('Inspector Quote sample preset', () => {
  it('assembles the whole replica look and content in one undoable step', () => {
    renderInspector()

    fireEvent.click(screen.getByRole('button', { name: /Trích dẫn/i }))

    const card = useCardStore.getState().card
    expect(card).toMatchObject({
      theme: 'mist',
      ratio: '1:1',
      uppercaseHeadline: true,
      headlineSize: 46,
      qrEnabled: false,
      boldSublines: true,
      avatarGrayscale: true,
      headline: 'Làm ít, làm sâu, làm thật.',
      sublines: 'Ít tính năng hơn.\nÍt lời hứa hơn.\nNhiều giá trị hơn.',
      authorBio: 'Founder độc lập / Build mỗi ngày\nMentor / Nhà đầu tư',
      qrCta: 'Theo dõi hành trình indie!',
    })

    // The whole preset is one history step, not one per field — undo
    // returns to the baseline the step started from.
    act(() => useCardStore.getState().undo())
    expect(useCardStore.getState().card).toEqual(freshQuoteCard())
  })

  it('marks the Quote preset active while the current state matches it', () => {
    renderInspector()

    const quote = screen.getByRole('button', { name: /Trích dẫn/i })
    expect(quote.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(quote)
    expect(quote.getAttribute('aria-pressed')).toBe('true')
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
    const qrToggle = screen.getByRole('switch', { name: /Hiển thị Mã QR/i })
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
    const toggle = screen.getByRole('switch', { name: /Avatar đen trắng/i })
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

describe('Inspector Card Type switcher', () => {
  const typeGroup = () => screen.getByRole('radiogroup', { name: 'Loại Card' })

  it('leads the Content tab in Quote mode with Quote checked', () => {
    renderInspector()

    const group = typeGroup()
    expect(
      within(group).getByRole('radio', { name: 'Trích dẫn' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      within(group).getByRole('radio', { name: 'Giới thiệu' }).getAttribute('aria-checked'),
    ).toBe('false')
  })

  it('switches to Showcase through the store action when its segment is pressed', () => {
    renderInspector()

    fireEvent.click(within(typeGroup()).getByRole('radio', { name: 'Giới thiệu' }))

    expect(useCardStore.getState().card.cardType).toBe('showcase')
  })

  it('stays visible in Showcase mode and switches back to Quote', () => {
    renderInspector()
    fireEvent.click(within(typeGroup()).getByRole('radio', { name: 'Giới thiệu' }))

    fireEvent.click(within(typeGroup()).getByRole('radio', { name: 'Trích dẫn' }))

    expect(useCardStore.getState().card.cardType).toBe('quote')
  })
})

describe('Inspector Showcase Screenshots section', () => {
  const switchToShowcase = () => {
    const result = renderInspector()
    fireEvent.click(screen.getByRole('radio', { name: 'Giới thiệu' }))
    return result
  }
  const shots = () => useCardStore.getState().card.showcase?.shots ?? []

  it('replaces Presets and Headline with the Screenshots section in Showcase mode', () => {
    switchToShowcase()

    expect(screen.getByText('Ảnh chụp màn hình')).not.toBeNull()
    expect(screen.queryByText('Mẫu nhanh')).toBeNull()
    expect(screen.queryByLabelText('Tiêu đề chính')).toBeNull()
    expect((screen.getByRole('button', { name: 'Thêm ảnh' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })

  it('adds a Shot through the screenshot ingest when a file is picked', async () => {
    const { container } = switchToShowcase()
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, {
      target: { files: [new File(['png-bytes'], 'shot.png', { type: 'image/png' })] },
    })

    await waitFor(() => {
      expect(shots()).toHaveLength(1)
    })
    expect(shots()[0].dataUrl).toBe('data:image/jpeg;base64,ingested')
    expect(screen.getByRole('img', { name: 'Ảnh chụp màn hình 1' })).not.toBeNull()
  })

  it('removes a Shot when its thumbnail delete button is pressed', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))

    fireEvent.click(screen.getByRole('button', { name: 'Xóa ảnh' }))

    expect(shots()).toHaveLength(0)
  })

  it('disables adding and explains the cap once three Shots exist', () => {
    switchToShowcase()
    act(() => {
      useCardStore.getState().addShot('data:image/jpeg;base64,one')
      useCardStore.getState().addShot('data:image/jpeg;base64,two')
      useCardStore.getState().addShot('data:image/jpeg;base64,three')
    })

    expect((screen.getByRole('button', { name: 'Thêm ảnh' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect(screen.getByText(/Tối đa 3 ảnh/)).not.toBeNull()
  })
  it('reveals a fit switcher for a selected shot and applies the choice to the store', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))

    // Nothing to switch until a shot is selected.
    expect(screen.queryByRole('radiogroup', { name: 'Hiển thị ảnh' })).toBeNull()

    fireEvent.click(screen.getByRole('img', { name: 'Ảnh chụp màn hình 1' }))
    // No override yet: the switcher reads Tự động (ADR 0006 §1).
    expect(screen.getByRole('radio', { name: 'Tự động' }).getAttribute('aria-checked')).toBe('true')

    fireEvent.click(screen.getByRole('radio', { name: 'Trọn ảnh' }))
    expect(useCardStore.getState().card.showcase!.shots[0].fit).toBe('contain')
  })

  it('Tự động clears a fit override back to the derived default', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))
    const shot = useCardStore.getState().card.showcase!.shots[0]
    act(() => useCardStore.getState().setShotFit(shot.id, 'contain'))
    fireEvent.click(screen.getByRole('img', { name: 'Ảnh chụp màn hình 1' }))
    expect(screen.getByRole('radio', { name: 'Trọn ảnh' }).getAttribute('aria-checked')).toBe(
      'true',
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Tự động' }))
    expect(useCardStore.getState().card.showcase!.shots[0].fit).toBeUndefined()
    expect(screen.getByRole('radio', { name: 'Tự động' }).getAttribute('aria-checked')).toBe('true')
  })

  it('deselects a selected shot when its thumbnail is clicked again', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))
    fireEvent.click(screen.getByRole('img', { name: 'Ảnh chụp màn hình 1' }))
    expect(screen.getByRole('radiogroup', { name: 'Hiển thị ảnh' })).not.toBeNull()

    fireEvent.click(screen.getByRole('img', { name: 'Ảnh chụp màn hình 1' }))
    expect(screen.queryByRole('radiogroup', { name: 'Hiển thị ảnh' })).toBeNull()
  })
})

describe('Inspector Showcase Annotations section', () => {
  const switchToShowcase = () => {
    renderInspector()
    fireEvent.click(screen.getByRole('radio', { name: 'Giới thiệu' }))
  }
  const shots = () => useCardStore.getState().card.showcase?.shots ?? []
  const annotations = () => useCardStore.getState().card.showcase?.annotations ?? []

  it('adds an annotation bound to its Shot from the per-Shot add control', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))

    fireEvent.click(screen.getByRole('button', { name: 'Thêm ghi chú · Ảnh chụp màn hình 1' }))

    expect(annotations()).toHaveLength(1)
    expect(annotations()[0].shotId).toBe(shots()[0].id)
    expect(annotations()[0].text).toBe('')
    expect(screen.getByLabelText('Nội dung ghi chú')).not.toBeNull()
  })

  it('edits the annotation text through its field', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))
    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: '', side: 'left' }),
    )

    fireEvent.change(screen.getByLabelText('Nội dung ghi chú'), {
      target: { value: 'Tổng quan ý tưởng' },
    })

    expect(annotations()[0].text).toBe('Tổng quan ý tưởng')
  })

  it('retargets an annotation to a free Shot through the target selector', () => {
    switchToShowcase()
    act(() => {
      useCardStore.getState().addShot('data:image/jpeg;base64,one')
      useCardStore.getState().addShot('data:image/jpeg;base64,two')
    })
    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: 'a', side: 'left' }),
    )

    fireEvent.change(screen.getByLabelText('Ảnh đích'), { target: { value: shots()[1].id } })

    expect(annotations()[0].shotId).toBe(shots()[1].id)
  })

  it('changes the annotation side through the side selector', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))
    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: 'a', side: 'left' }),
    )

    fireEvent.change(screen.getByLabelText('Vị trí'), { target: { value: 'right' } })

    expect(annotations()[0].side).toBe('right')
  })

  it('removes an annotation through its delete button', () => {
    switchToShowcase()
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))
    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: 'a', side: 'left' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Xóa ghi chú' }))

    expect(annotations()).toHaveLength(0)
  })

  it('disables each Shot add affordance once that Shot carries its one annotation', () => {
    switchToShowcase()
    act(() => {
      useCardStore.getState().addShot('data:image/jpeg;base64,one')
      useCardStore.getState().addShot('data:image/jpeg;base64,two')
    })
    const addFor = (position: number) =>
      screen.getByRole('button', {
        name: `Thêm ghi chú · Ảnh chụp màn hình ${position}`,
      }) as HTMLButtonElement

    expect(addFor(1).disabled).toBe(false)
    expect(addFor(2).disabled).toBe(false)

    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: 'a', side: 'left' }),
    )
    expect(addFor(1).disabled).toBe(true)
    expect(addFor(2).disabled).toBe(false)
  })

  it('explains the per-Shot cap and offers no adds once every Shot is annotated', () => {
    switchToShowcase()
    act(() => {
      useCardStore.getState().addShot('data:image/jpeg;base64,one')
      useCardStore.getState().addShot('data:image/jpeg;base64,two')
    })
    act(() => {
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: 'a', side: 'left' })
      useCardStore.getState().addAnnotation({ shotId: shots()[1].id, text: 'b', side: 'left' })
    })

    expect(
      screen
        .queryAllByRole('button', { name: /Thêm ghi chú/ })
        .every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true)
    expect(screen.getByText('Mỗi ảnh có tối đa một ghi chú.')).not.toBeNull()
  })

  it('offers only free Shots in the target selector', () => {
    switchToShowcase()
    act(() => {
      useCardStore.getState().addShot('data:image/jpeg;base64,one')
      useCardStore.getState().addShot('data:image/jpeg;base64,two')
    })
    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[0].id, text: 'a', side: 'left' }),
    )
    act(() =>
      useCardStore.getState().addAnnotation({ shotId: shots()[1].id, text: 'b', side: 'left' }),
    )
    const targetSelects = screen.getAllByLabelText('Ảnh đích') as HTMLSelectElement[]

    // Annotation 1 targets Shot 1: Shot 2 is taken by annotation 2.
    const takenOption = within(targetSelects[0]).getByRole('option', {
      name: 'Ảnh chụp màn hình 2',
    }) as HTMLOptionElement
    expect(takenOption.disabled).toBe(true)
    const ownOption = within(targetSelects[0]).getByRole('option', {
      name: 'Ảnh chụp màn hình 1',
    }) as HTMLOptionElement
    expect(ownOption.disabled).toBe(false)
  })

  it('explains that a Shot is needed before any annotation can be added', () => {
    switchToShowcase()

    expect(screen.queryByRole('button', { name: /Thêm ghi chú/ })).toBeNull()
    expect(screen.getByText('Thêm ảnh chụp màn hình trước khi ghi chú.')).not.toBeNull()
  })

  it('joins the Screenshots section in the Showcase Content tab only', () => {
    switchToShowcase()

    expect(screen.getByText('Ghi chú')).not.toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Trích dẫn' }))
    expect(screen.queryByText('Ghi chú')).toBeNull()
  })
})

describe('Inspector presets in Showcase mode', () => {
  const switchToShowcase = () => {
    renderInspector()
    fireEvent.click(screen.getByRole('radio', { name: 'Giới thiệu' }))
  }

  it('keeps the Quote Content tab as Presets + Headline beside the switcher', () => {
    renderInspector()

    expect(screen.getByText('Mẫu nhanh')).not.toBeNull()
    expect(screen.getByLabelText('Tiêu đề chính')).not.toBeNull()
    expect(screen.queryByText('Ảnh chụp màn hình')).toBeNull()
  })

  it('hides the Style Presets grid in Showcase while the theme control stays', () => {
    switchToShowcase()
    fireEvent.click(screen.getByRole('radio', { name: /Kiểu/ }))

    expect(screen.queryByText('Mẫu phong cách')).toBeNull()
    expect(screen.getByRole('radiogroup', { name: 'Màu nền' })).not.toBeNull()
  })
})

describe('Inspector Style tab in Showcase mode', () => {
  const openShowcaseStyle = () => {
    renderInspector()
    fireEvent.click(screen.getByRole('radio', { name: 'Giới thiệu' }))
    fireEvent.click(screen.getByRole('radio', { name: /Kiểu/ }))
  }

  it('hides the dead ratio, headline size and casing controls while the theme stays usable', async () => {
    openShowcaseStyle()

    expect(screen.queryByRole('radiogroup', { name: 'Tỉ lệ khung hình' })).toBeNull()
    expect(screen.queryByRole('spinbutton', { name: /Cỡ chữ tiêu đề/ })).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'In hoa' })).toBeNull()

    const themeGroup = screen.getByRole('radiogroup', { name: 'Màu nền' })
    fireEvent.click(within(themeGroup).getByRole('radio', { name: /Sương/i }))

    await waitFor(() => {
      expect(useCardStore.getState().card.theme).toBe('mist')
    })
  })

  it('keeps the Quote Style tab unchanged', () => {
    renderInspector('style')

    expect(screen.getByRole('radiogroup', { name: 'Tỉ lệ khung hình' })).not.toBeNull()
    expect(screen.getByRole('spinbutton', { name: /Cỡ chữ tiêu đề/ })).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'In hoa' })).not.toBeNull()
  })
})

describe('Inspector Card Type labels', () => {
  it('labels the switcher in English when the Interface Language is English', () => {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, 'en')
    renderInspector()

    const group = screen.getByRole('radiogroup', { name: 'Card type' })
    expect(within(group).getByRole('radio', { name: 'Quote' })).not.toBeNull()
    expect(within(group).getByRole('radio', { name: 'Showcase' })).not.toBeNull()
  })

  it('labels the Annotations section and its add affordance in English', () => {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, 'en')
    renderInspector()
    fireEvent.click(screen.getByRole('radio', { name: 'Showcase' }))
    act(() => useCardStore.getState().addShot('data:image/jpeg;base64,one'))

    expect(screen.getByText('Annotations')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Add annotation · Screenshots 1' })).not.toBeNull()
  })
})
