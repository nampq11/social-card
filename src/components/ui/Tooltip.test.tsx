// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Tooltip } from './Tooltip'

afterEach(() => {
  cleanup()
})

describe('Tooltip', () => {
  it('keeps the child as the trigger with its own accessible name', () => {
    render(
      <Tooltip label="Undo">
        <button type="button" aria-label="Undo last change">
          ⟲
        </button>
      </Tooltip>,
    )

    expect(screen.getByRole('button', { name: 'Undo last change' })).toBeTruthy()
  })

  it('reveals the label when the trigger is focused', async () => {
    render(
      <Tooltip label="Undo">
        <button type="button">⟲</button>
      </Tooltip>,
    )

    fireEvent.focus(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByText('Undo')).toBeTruthy())
  })
})
