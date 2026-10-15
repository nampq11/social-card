// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'
import { useEffectiveFit } from './use-effective-fit'
import type { Shot } from '../types'

afterEach(() => cleanup())

// jsdom never decodes images: hand-stubbed natural dimensions per URL, with
// onload resolving on a microtask like a real async decode would.
const DIMS: Record<string, { width: number; height: number }> = {}
vi.stubGlobal(
  'Image',
  class {
    naturalWidth = 0
    naturalHeight = 0
    onload: (() => void) | null = null
    set src(url: string) {
      const dims = DIMS[url]
      if (!dims) throw new Error(`no dims stubbed for ${url}`)
      this.naturalWidth = dims.width
      this.naturalHeight = dims.height
      queueMicrotask(() => this.onload?.())
    }
  },
)

// Slot layout stub: a 2:1 box, so a 2:1 shot derives cover and a square
// derives contain — distinguishable auto-fits.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => {
    return {
      width: 300,
      height: 150,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 300,
      bottom: 150,
      toJSON: () => ({}),
    } as DOMRect
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const FitHarness = ({ shot }: { shot: Shot }) => {
  const slotRef = useRef<HTMLDivElement>(null)
  const fit = useEffectiveFit(shot, slotRef)
  return <div ref={slotRef} data-testid="fit-surface" data-fit={fit} />
}

const fitOf = () => screen.getByTestId('fit-surface').dataset.fit

describe('effective fit derivation (ADR 0006 §1)', () => {
  it('derives from the shot-to-slot ratio once the decode lands', async () => {
    DIMS['data:matched'] = { width: 600, height: 300 }
    DIMS['data:square'] = { width: 300, height: 300 }

    const { rerender } = render(<FitHarness shot={{ id: 'shot-1', dataUrl: 'data:matched' }} />)
    await waitFor(() => expect(fitOf()).toBe('cover'))

    rerender(<FitHarness shot={{ id: 'shot-1', dataUrl: 'data:square' }} />)
    await waitFor(() => expect(fitOf()).toBe('contain'))

    // Back to the first image — its decode is cached now, and the fit must
    // re-derive from the swapped-in dimensions instead of keeping the
    // square's contain.
    rerender(<FitHarness shot={{ id: 'shot-1', dataUrl: 'data:matched' }} />)
    await waitFor(() => expect(fitOf()).toBe('cover'))
  })

  it('an explicit fit override wins over any derivation', async () => {
    DIMS['data:override'] = { width: 600, height: 300 }
    render(<FitHarness shot={{ id: 'shot-2', dataUrl: 'data:override', fit: 'contain' }} />)
    await waitFor(() => expect(fitOf()).toBe('contain'))
  })
})
