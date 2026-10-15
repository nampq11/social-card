// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FieldLabel } from './FieldLabel'

afterEach(() => {
  cleanup()
})

describe('FieldLabel', () => {
  it('associates with its control through htmlFor', () => {
    render(
      <>
        <FieldLabel htmlFor="headline">Headline</FieldLabel>
        <input id="headline" />
      </>,
    )

    expect(screen.getByLabelText('Headline')).toBeTruthy()
  })

  it('carries an id for aria-labelledby wiring', () => {
    render(<FieldLabel id="card-type-label">Card type</FieldLabel>)

    expect(screen.getByText('Card type').getAttribute('id')).toBe('card-type-label')
  })

  it('renders the aside beside the label', () => {
    render(<FieldLabel aside={<span>2/4</span>}>Shots</FieldLabel>)

    expect(screen.getByText('Shots')).toBeTruthy()
    expect(screen.getByText('2/4')).toBeTruthy()
  })
})
