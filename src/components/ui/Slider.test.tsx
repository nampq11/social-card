// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Slider } from './Slider'

afterEach(() => {
  cleanup()
})

describe('Slider', () => {
  it('exposes the range contract on the slider role', () => {
    render(
      <Slider
        value={42}
        min={24}
        max={60}
        aria-labelledby="headline-size-label"
        onValueChange={() => {}}
      />,
    )

    // base-ui renders a visually-hidden native <input type="range"> as the
    // slider: the min/max/value contract lives on the native attributes
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.getAttribute('aria-valuenow')).toBe('42')
    expect(slider.min).toBe('24')
    expect(slider.max).toBe('60')
  })

  it('steps the value with the arrow keys', () => {
    const onValueChange = vi.fn()
    render(
      <Slider
        value={42}
        min={24}
        max={60}
        aria-labelledby="headline-size-label"
        onValueChange={onValueChange}
      />,
    )

    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' })
    expect(onValueChange.mock.calls[0]![0]).toBe(43)

    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowLeft' })
    expect(onValueChange.mock.calls.at(-1)![0]).toBe(41)
  })
})
