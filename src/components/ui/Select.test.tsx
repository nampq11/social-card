// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Select } from './Select'

afterEach(() => {
  cleanup()
})

describe('Select', () => {
  it('renders its options under the accessible name', () => {
    render(
      <Select aria-label="Annotation side" value="left" onChange={() => {}}>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </Select>,
    )

    expect(screen.getByRole('combobox', { name: 'Annotation side' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Right' })).toBeTruthy()
  })

  it('fires onChange with the picked option value', () => {
    // Capture inside the handler: a controlled select is re-controlled to
    // its value prop after the event, so a deferred read of target.value
    // would see the restored value, not the pick
    const picked: string[] = []
    render(
      <Select
        aria-label="Annotation side"
        value="left"
        onChange={(e) => picked.push(e.target.value)}
      >
        <option value="left">Left</option>
        <option value="right">Right</option>
      </Select>,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'right' } })
    expect(picked).toEqual(['right'])
  })
})
