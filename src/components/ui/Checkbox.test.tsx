// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

afterEach(() => {
  cleanup()
})

describe('Checkbox', () => {
  it('renders a named checkbox whose label also toggles it', () => {
    const onCheckedChange = vi.fn()
    render(
      <Checkbox
        id="bold-sublines"
        label="Bold sublines"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    )

    // base-ui passes (checked, eventDetails); assert the state argument
    const lastCall = () => onCheckedChange.mock.calls.at(-1)![0]
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bold sublines' }))
    expect(lastCall()).toBe(true)

    fireEvent.click(screen.getByText('Bold sublines'))
    expect(lastCall()).toBe(true)
  })

  it('mirrors the checked prop in its accessible state', () => {
    const { rerender } = render(
      <Checkbox id="uppercase" label="Uppercase" checked={false} onCheckedChange={() => {}} />,
    )
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false')

    rerender(<Checkbox id="uppercase" label="Uppercase" checked onCheckedChange={() => {}} />)
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true')
  })
})
