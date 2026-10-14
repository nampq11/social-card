// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CardPreview } from './CardPreview'
import { CARD_THEME_STYLES } from '../constants/card-theme'
import { UiCopyProvider } from '../lib/i18n'
import { useCardStore } from '../lib/card-store'
import { FALLBACK_AUTHOR_NAME } from '../constants/presets'
import type { AnnotationSide, CardState } from '../types'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  useCardStore.getState().resetCard()
})

const renderCard = (state: Partial<CardState> = {}) => {
  act(() => {
    useCardStore.getState().patchCard(state)
  })
  return render(
    <UiCopyProvider>
      <CardPreview />
    </UiCopyProvider>,
  )
}

describe('CardPreview', () => {
  it('renders the card headline and sublines', () => {
    renderCard({
      headline: 'Em vừa được tậu đất:',
      sublines: 'lanphinh.com\nlanphinh.io',
    })

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toBe('Em vừa được tậu đất:')
    expect(screen.queryByText('lanphinh.com')).not.toBeNull()
    expect(screen.queryByText('lanphinh.io')).not.toBeNull()
  })

  it('renders bold sublines with the theme main text color when boldSublines is on', () => {
    const { container } = renderCard({
      theme: 'mist',
      boldSublines: true,
      sublines: 'lanphinh.com',
    })

    const sublinesBlock = container.querySelector('[data-testid="sublines"]')
    expect(sublinesBlock?.className).toContain('font-semibold')
    expect(sublinesBlock?.className).toContain(CARD_THEME_STYLES.mist.text)
    expect(sublinesBlock?.className).not.toContain(CARD_THEME_STYLES.mist.subtext)
  })

  it('renders each bio line as its own element, dropping blank lines', () => {
    renderCard({
      authorName: 'Nam',
      authorBio: 'Founder độc lập\n\n   \nMentor / Nhà đầu tư',
    })

    const first = screen.getByText('Founder độc lập')
    const second = screen.getByText('Mentor / Nhà đầu tư')
    expect(first.tagName).toBe('P')
    expect(second.tagName).toBe('P')
    expect(first).not.toBe(second)
  })
  it('keeps a blank bio hidden', () => {
    const { container } = renderCard({ authorName: 'Nam', authorBio: '   \n  ' })

    expect(container.querySelector('[data-testid="author-bio"]')).toBeNull()
  })

  it('renders the grayscale class on the avatar image when avatarGrayscale is on', () => {
    renderCard({ theme: 'mist', avatarGrayscale: true })

    const avatar = screen.getByAltText(FALLBACK_AUTHOR_NAME)
    expect(avatar.className).toContain('grayscale')
  })

  it('renders the avatar in full color when avatarGrayscale is off', () => {
    renderCard({ theme: 'mist' })

    const avatar = screen.getByAltText(FALLBACK_AUTHOR_NAME)
    expect(avatar.className).not.toContain('grayscale')
  })

  it('renders normal-weight muted sublines when boldSublines is off', () => {
    const { container } = renderCard({ theme: 'mist', sublines: 'lanphinh.com' })

    const sublinesBlock = container.querySelector('[data-testid="sublines"]')
    expect(sublinesBlock?.className).toContain('font-normal')
    expect(sublinesBlock?.className).toContain(CARD_THEME_STYLES.mist.subtext)
    expect(sublinesBlock?.className).not.toContain(CARD_THEME_STYLES.mist.text)
    expect(sublinesBlock?.className).not.toContain('font-semibold')
  })

  it('renders fallback hint when headline is empty', () => {
    renderCard({ headline: '' })
    const h1 = screen.getByRole('heading', { level: 1 })
    // Default initial language is Vietnamese
    expect(h1.textContent).toBe('NHẬP TIÊU ĐỀ TẠI ĐÂY')
  })

  it('applies uppercase styling when uppercaseHeadline is enabled', () => {
    renderCard({ uppercaseHeadline: true })

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.className).toContain('uppercase')

    act(() => {
      useCardStore.getState().patchCard({ uppercaseHeadline: false })
    })
    expect(h1.className).not.toContain('uppercase')
  })

  it('renders author fallback when authorName is empty', () => {
    renderCard({ authorName: '' })
    expect(screen.queryByText(FALLBACK_AUTHOR_NAME)).not.toBeNull()
  })

  it('renders QR code and CTA when qrEnabled is true', () => {
    renderCard({ qrEnabled: true, qrCta: 'Quét để xem mã nguồn' })
    expect(screen.queryByText('Quét để xem mã nguồn')).not.toBeNull()
  })

  it('omits QR code and CTA when qrEnabled is false', () => {
    renderCard({ qrEnabled: false, qrCta: 'Quét để xem mã nguồn' })
    expect(screen.queryByText('Quét để xem mã nguồn')).toBeNull()
  })

  it('centers the signature with avatar before name when QR is off', () => {
    const { container } = renderCard({
      qrEnabled: false,
      authorName: 'Nam Pham',
      avatarUrl: 'https://example.com/a.png',
    })
    const cardNode = container.querySelector('#social-card-node')
    expect(cardNode).not.toBeNull()

    const footer = cardNode?.querySelector('[data-testid="card-footer"]')
    expect(footer?.className).toContain('justify-center')
    expect(footer?.className).not.toContain('justify-between')

    const name = screen.getByText('Nam Pham')
    const avatar = cardNode?.querySelector('img')
    expect(avatar).not.toBeNull()
    const order = avatar?.compareDocumentPosition(name as Node) ?? 0
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('centers the signature without an avatar when QR is off', () => {
    const { container } = renderCard({
      qrEnabled: false,
      authorName: 'Nam Pham',
      avatarUrl: '',
    })
    const cardNode = container.querySelector('#social-card-node')
    expect(cardNode?.querySelector('img')).toBeNull()
    const footer = cardNode?.querySelector('[data-testid="card-footer"]')
    expect(footer?.className).toContain('justify-center')
    expect(screen.queryByText('Nam Pham')).not.toBeNull()
  })

  it('keeps the QR-on footer layout unchanged: name before avatar, space-between', () => {
    const { container } = renderCard({
      qrEnabled: true,
      authorName: 'Nam Pham',
      avatarUrl: 'https://example.com/a.png',
    })
    const cardNode = container.querySelector('#social-card-node')
    const footer = cardNode?.querySelector('[data-testid="card-footer"]')
    expect(footer?.className).toContain('justify-between')
    expect(footer?.className).not.toContain('justify-center')

    const name = screen.getByText('Nam Pham')
    const avatar = cardNode?.querySelector('img')
    const order = avatar?.compareDocumentPosition(name as Node) ?? 0
    expect(order & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  })

  it('uses theme border on QR container without leaking ambient dark classes', () => {
    const { container } = renderCard({ qrEnabled: true, theme: 'white' })
    const qrContainer = container.querySelector('#social-card-node [data-testid="qr-container"]')
    expect(qrContainer).not.toBeNull()
    expect(qrContainer?.className).not.toContain('dark:border-white/10')
    expect(qrContainer?.className).toContain('border-black/5')
  })

  it('applies the mist palette: cool-gray card background and QR container border', () => {
    const { container } = renderCard({ qrEnabled: true, theme: 'mist' })
    const cardNode = container.querySelector('#social-card-node')
    expect(cardNode?.className).toContain(CARD_THEME_STYLES.mist.bg)
    const qrContainer = container.querySelector('#social-card-node [data-testid="qr-container"]')
    expect(qrContainer?.className).toContain(CARD_THEME_STYLES.mist.border)
  })

  it('uses normal tracking on subline elements for optical legibility', () => {
    renderCard({ sublines: 'Testing optical tracking' })
    const line = screen.getByText('Testing optical tracking')
    expect(line.className).not.toContain('tracking-tight')
  })
})

describe('Showcase Card', () => {
  it('renders a dashed hero placeholder and no Quote content when no shots exist', () => {
    const { container } = renderCard({ cardType: 'showcase' })

    const placeholder = screen
      .getByTestId('hero-slot')
      .querySelector('[data-testid="slot-placeholder"]')
    expect(placeholder).not.toBeNull()
    expect(placeholder?.className).toContain('border-dashed')
    expect(screen.getByTestId('hero-slot').querySelector('img')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(container.querySelector('[data-testid="sublines"]')).toBeNull()
    expect(container.querySelector('[data-testid="qr-container"]')).toBeNull()
  })

  it('renders the first shot as the hero alone when one shot exists', () => {
    renderCard({
      cardType: 'showcase',
      showcase: {
        shots: [{ id: 'shot-1', dataUrl: 'data:image/png;base64,ONE' }],
        annotations: [],
      },
    })

    expect(screen.getByTestId('hero-slot').querySelector('img')?.getAttribute('src')).toBe(
      'data:image/png;base64,ONE',
    )
    expect(screen.queryByTestId('detail-slot')).toBeNull()
    expect(screen.queryByTestId('slot-placeholder')).toBeNull()
  })

  it('renders hero plus one detail slot with two shots', () => {
    renderCard({
      cardType: 'showcase',
      showcase: {
        shots: [
          { id: 'shot-1', dataUrl: 'data:image/png;base64,ONE' },
          { id: 'shot-2', dataUrl: 'data:image/png;base64,TWO' },
        ],
        annotations: [],
      },
    })

    expect(screen.getAllByTestId('detail-slot')).toHaveLength(1)
  })

  it('renders added shots as a hero above side-by-side detail slots', () => {
    renderCard({ cardType: 'showcase' })
    act(() => {
      const store = useCardStore.getState()
      store.addShot('data:image/png;base64,ONE')
      store.addShot('data:image/png;base64,TWO')
      store.addShot('data:image/png;base64,THREE')
    })

    expect(screen.getByTestId('hero-slot').querySelector('img')?.getAttribute('src')).toBe(
      'data:image/png;base64,ONE',
    )
    const details = screen.getAllByTestId('detail-slot')
    expect(details).toHaveLength(2)
    expect(details[0].parentElement).toBe(details[1].parentElement)
    const order = screen.getByTestId('hero-slot').compareDocumentPosition(details[0])
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(details[0].querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,TWO')
    expect(screen.queryByTestId('slot-placeholder')).toBeNull()
  })

  it('centers the avatar above name and bio in the showcase footer', () => {
    const { container } = renderCard({
      cardType: 'showcase',
      qrEnabled: true,
      authorName: 'Nam Phạm',
      authorBio: 'AI Engineer\nBuilder',
      avatarUrl: 'data:image/png;base64,AV',
    })

    const footer = container.querySelector('[data-testid="card-footer"]')
    expect(footer?.className).toContain('items-center')
    // QR is Quote-only content, even when the flag survived a type switch
    expect(container.querySelector('[data-testid="qr-container"]')).toBeNull()

    const avatar = screen.getByAltText('Nam Phạm')
    const name = screen.getByText('Nam Phạm')
    expect(avatar.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const bio = footer?.querySelector('[data-testid="author-bio"]')
    expect(bio?.textContent).toContain('AI Engineer')
    expect(bio?.textContent).toContain('Builder')
  })

  it('centers name and bio without an avatar, with no monogram stand-in', () => {
    const { container } = renderCard({
      cardType: 'showcase',
      authorName: 'Nam Phạm',
      authorBio: 'AI Engineer',
      avatarUrl: '',
    })

    expect(container.querySelector('img')).toBeNull()
    const footer = container.querySelector('[data-testid="card-footer"]')
    expect(footer?.className).toContain('items-center')
    expect(screen.getByText('Nam Phạm')).not.toBeNull()
    expect(footer?.querySelector('[data-testid="author-bio"]')?.textContent).toContain(
      'AI Engineer',
    )
  })

  it('reuses the theme tokens on the showcase canvas, slots and footer', () => {
    const { container } = renderCard({
      cardType: 'showcase',
      theme: 'dark',
      authorName: 'Nam Phạm',
      authorBio: 'AI Engineer',
      avatarUrl: 'data:image/png;base64,AV',
    })

    const cardNode = container.querySelector('#social-card-node')
    expect(cardNode?.className).toContain(CARD_THEME_STYLES.dark.bg)
    expect(screen.getByTestId('hero-slot').className).toContain(CARD_THEME_STYLES.dark.avatarBorder)
    expect(container.querySelector('[data-testid="author-bio"]')?.className).toContain(
      CARD_THEME_STYLES.dark.subtext,
    )
  })

  it('renders square dimensions when the store switches a 16:9 card to showcase', () => {
    const { container } = renderCard({ ratio: '16:9' })
    act(() => {
      useCardStore.getState().switchCardType()
    })

    const cardNode = container.querySelector('#social-card-node') as HTMLElement | null
    expect(cardNode?.style.width).toBe('720px')
    expect(cardNode?.style.height).toBe('720px')
  })
})

describe('Showcase Annotations', () => {
  it('renders the annotation text inside its shot slot, diacritics intact', () => {
    renderCard({
      cardType: 'showcase',
      showcase: {
        shots: [{ id: 'shot-1', dataUrl: 'data:image/png;base64,ONE' }],
        annotations: [
          { id: 'annotation-1', shotId: 'shot-1', text: 'Tổng quan ý tưởng', side: 'left' },
        ],
      },
    })

    const text = screen.getByText('Tổng quan ý tưởng')
    expect(screen.getByTestId('hero-slot').contains(text)).toBe(true)
  })
})

describe('Showcase Annotation sides', () => {
  const sides = [
    { shotId: 'shot-1', side: 'left' },
    { shotId: 'shot-2', side: 'right' },
    { shotId: 'shot-3', side: 'top' },
  ] as const

  const renderSides = () =>
    renderCard({
      cardType: 'showcase',
      showcase: {
        shots: [
          { id: 'shot-1', dataUrl: 'data:image/png;base64,ONE' },
          { id: 'shot-2', dataUrl: 'data:image/png;base64,TWO' },
          { id: 'shot-3', dataUrl: 'data:image/png;base64,THREE' },
        ],
        annotations: sides.map((input, idx) => ({
          id: `annotation-${idx}`,
          text: `Note ${idx}`,
          ...input,
        })),
      },
    })

  // Tailwind placement fragments: right-full = mark's right edge flush with
  // the slot's left edge (left margin); the others mirror it per margin.
  const marginFragment = { left: 'right-full', right: 'left-full', top: 'bottom-full' } as const

  const sideCases: { side: AnnotationSide; text: string }[] = [
    { side: 'left', text: 'Note 0' },
    { side: 'right', text: 'Note 1' },
    { side: 'top', text: 'Note 2' },
  ]

  it.each(sideCases)('places a $side annotation in the $side margin', ({ side, text }) => {
    renderSides()

    const mark = screen.getByText(text).closest('[data-testid="annotation"]')
    expect(mark?.className).toContain(marginFragment[side])
  })
})

describe('Showcase Annotation following', () => {
  it('follows its shot into the hero slot when an earlier shot is removed', () => {
    renderCard({
      cardType: 'showcase',
      showcase: {
        shots: [
          { id: 'shot-1', dataUrl: 'data:image/png;base64,ONE' },
          { id: 'shot-2', dataUrl: 'data:image/png;base64,TWO' },
        ],
        annotations: [{ id: 'annotation-2', shotId: 'shot-2', text: 'Điểm nhấn', side: 'top' }],
      },
    })

    act(() => {
      useCardStore.getState().removeShot('shot-1')
    })

    // shot-2 was a detail slot; removing shot-1 promotes it to hero and the
    // annotation must ride along (binds to Shots, not slots).
    const text = screen.getByText('Điểm nhấn')
    expect(screen.getByTestId('hero-slot').contains(text)).toBe(true)
    expect(screen.queryByTestId('detail-slot')?.contains(text) ?? false).toBe(false)
  })
})
