// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CardPreview } from './CardPreview'
import { CARD_THEME_STYLES } from '../constants/card-theme'
import { UiCopyProvider } from '../lib/i18n'
import { useCardStore } from '../lib/card-store'
import { FALLBACK_AUTHOR_NAME } from '../constants/presets'
import type { CardState } from '../types'

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
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(container.querySelector('[data-testid="sublines"]')).toBeNull()
    expect(container.querySelector('[data-testid="qr-container"]')).toBeNull()
  })
})
