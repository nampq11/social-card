// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

afterEach(() => {
  cleanup()
})

describe('Switch', () => {
  it('renders a named switch that reports toggles', () => {
    const onCheckedChange = vi.fn()
    render(<Switch id="qr-toggle" label="Show QR code" checked onCheckedChange={onCheckedChange} />)

    fireEvent.click(screen.getByRole('switch', { name: 'Show QR code' }))
    // base-ui passes (checked, eventDetails); assert the state argument
    expect(onCheckedChange.mock.calls[0]![0]).toBe(false)
  })

  it('mirrors the checked prop in its accessible state', () => {
    const { rerender } = render(
      <Switch id="grayscale" label="Grayscale avatar" checked onCheckedChange={() => {}} />,
    )
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')

    rerender(
      <Switch id="grayscale" label="Grayscale avatar" checked={false} onCheckedChange={() => {}} />,
    )
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
  })
})
