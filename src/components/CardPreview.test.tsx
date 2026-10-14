// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CardPreview } from './CardPreview'
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
    renderCard({ theme: 'mist', boldSublines: true, sublines: 'lanphinh.com' })

    const sublinesBlock = screen.getByText('lanphinh.com').closest('div')
    expect(sublinesBlock?.className).toContain('font-semibold')
    expect(sublinesBlock?.className).toContain('text-[#101113]')
    expect(sublinesBlock?.className).not.toContain('text-[#3D4046]')
  })

  it('renders normal-weight muted sublines when boldSublines is off', () => {
    renderCard({ theme: 'mist', sublines: 'lanphinh.com' })

    const sublinesBlock = screen.getByText('lanphinh.com').closest('div')
    expect(sublinesBlock?.className).toContain('font-normal')
    expect(sublinesBlock?.className).toContain('text-[#3D4046]')
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
    expect(cardNode?.className).toContain('bg-[#E8EDF0]')
    const qrContainer = container.querySelector('#social-card-node [data-testid="qr-container"]')
    expect(qrContainer?.className).toContain('border-slate-300/60')
  })

  it('uses normal tracking on subline elements for optical legibility', () => {
    renderCard({ sublines: 'Testing optical tracking' })
    const line = screen.getByText('Testing optical tracking')
    expect(line.className).not.toContain('tracking-tight')
  })
})
