// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { useShotPan } from './use-shot-pan'
import { shotAnchorCss, DEFAULT_SHOT_FOCUS } from './shot-fit'
import { useCardStore } from './card-store'
import { triggerMediaQuery } from '../test/match-media'
import '../test/match-media'

afterEach(() => cleanup())

beforeEach(() => {
  useCardStore.getState().resetCard()
  act(() => {
    useCardStore.getState().switchCardType('showcase')
    useCardStore.getState().addShot('data:image/png;base16,PAN')
  })
  // The physics tests drive desktop drags: drag-always arming. The stub
  // instance exists only after something queries it — ask once, then flip.
  window.matchMedia('(hover: hover)')
  triggerMediaQuery('(hover: hover)', true)
})

// Layout stubs: jsdom has none. A 900×300 shot in a 300×150 slot covers at
// 0.5 → 450×150 rendered → 150px of horizontal overflow, none vertical —
// the same geometry as the shot-fit math tests.
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 300,
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 150,
  })
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    configurable: true,
    get: () => 900,
  })
  Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
    configurable: true,
    get: () => 300,
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
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

// rAF harness: physics frames advance only when the tests flush them, so
// spring settle behavior is deterministic.
let rafQueue: Array<(now: number) => void> = []
let rafNow = 0
beforeEach(() => {
  rafQueue = []
  vi.stubGlobal('requestAnimationFrame', (cb: (now: number) => void) => {
    rafQueue.push(cb)
    return rafQueue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})
const flushFrames = async (frames: number, stepMs = 16) => {
  for (let i = 0; i < frames; i++) {
    const queue = rafQueue
    rafQueue = []
    // Always ahead of the real clock by a frame: the glide seeds its dt from
    // performance.now(), so frame timestamps must stay monotonically above it
    // no matter how much real time the test spent since its beforeEach.
    rafNow = performance.now() + (i + 1) * stepMs
    act(() => queue.forEach((cb) => cb(rafNow)))
    await Promise.resolve()
  }
}

// The one interactive surface, wired exactly like ShotImage: store focus →
// object-position, transient overdrag → transform.
const PanHarness = () => {
  const shot = useCardStore((s) => s.card.showcase?.shots[0])
  const [selected, setSelected] = useState(false)
  const pan = useShotPan(shot?.id ?? '', 'cover', selected, () => setSelected(true))
  const anchor = shotAnchorCss(shot?.focus ?? DEFAULT_SHOT_FOCUS, 'cover')
  const { wheelElement } = pan
  return (
    <img
      ref={wheelElement}
      data-testid="pan-target"
      src={shot?.dataUrl}
      style={{
        objectPosition: anchor,
        transform: pan.overdrag ? `translate(${pan.overdrag.x}px, ${pan.overdrag.y}px)` : undefined,
      }}
      {...pan.handlers}
    />
  )
}

const drag = (el: Element, moves: Array<[number, number, number]>) => {
  const [x0, y0, t0] = moves[0]
  fireEvent.pointerDown(el, {
    pointerId: 1,
    pointerType: 'mouse',
    clientX: x0,
    clientY: y0,
    timeStamp: t0,
  })
  for (const [x, y, t] of moves.slice(1))
    fireEvent.pointerMove(el, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: x,
      clientY: y,
      timeStamp: t,
    })
  const [xe, ye, te] = moves[moves.length - 1]
  fireEvent.pointerUp(el, { pointerId: 1, clientX: xe, clientY: ye, timeStamp: te })
}

const focusOf = () => useCardStore.getState().card.showcase!.shots[0].focus ?? DEFAULT_SHOT_FOCUS

describe('pan physics (ADR 0006 §3, issue #38)', () => {
  it('an overdrag past the edge rubber-bands: store focus pegs, the visual resists', () => {
    const { getByTestId } = render(<PanHarness />)
    const el = getByTestId('pan-target')
    // 300px drag left from focus 0.5 (75px offset) → raw offset 375 against
    // 150 of overflow: 150 clamped + rubber-banded excess.
    drag(el, [
      [150, 75, 0],
      [50, 75, 16],
      [-150, 75, 300],
    ])

    expect(focusOf().x).toBe(1)
    const over = screen.getByTestId('pan-target').style.transform
    expect(over).toContain('translate')
    // The visual excess is strictly smaller than the raw 225px excess.
    const px = Number(over.match(/translate\((-?[\d.]+)px/)?.[1])
    expect(px).toBeLessThan(0) // content followed the finger leftward
    expect(Math.abs(px)).toBeGreaterThan(0)
    expect(Math.abs(px)).toBeLessThan(225)
  })

  it('releasing an overdrag springs the visual home and leaves focus at the edge', async () => {
    const { getByTestId } = render(<PanHarness />)
    const el = getByTestId('pan-target')
    drag(el, [
      [150, 75, 0],
      [-150, 75, 300],
    ])
    expect(focusOf().x).toBe(1)

    await flushFrames(60)

    expect(screen.getByTestId('pan-target').style.transform).toBe('')
    expect(focusOf().x).toBe(1)
  })

  it('a flick projects momentum into the resting focus; a dead release does not move', async () => {
    const { getByTestId, unmount } = render(<PanHarness />)
    // Violent rightward flick: ~4700px/s → coast ≈ 2345px against 150 overflow.
    drag(getByTestId('pan-target'), [
      [150, 75, 0],
      [260, 75, 16],
      [320, 75, 32],
    ])
    await flushFrames(120)
    const afterFlick = focusOf().x
    expect(afterFlick).toBe(0)
    unmount()

    // Part 1 left the focus at 0; from there, a drag left with two samples
    // sharing a timestamp — zero velocity, no coast — rests exactly at the
    // drag's end value instead of coasting further.
    render(<PanHarness />)
    const el = screen.getByTestId('pan-target')
    // jsdom stamps events with the real clock, so a slow drag is made with
    // real waits: ~100ms between moves keeps the release under the momentum
    // floor — a deliberate rest, not a flick.
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'mouse', clientX: 250, clientY: 75 })
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'mouse', clientX: 225, clientY: 75 })
    await new Promise((resolve) => setTimeout(resolve, 120))
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'mouse', clientX: 200, clientY: 75 })
    await new Promise((resolve) => setTimeout(resolve, 120))
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 200, clientY: 75 })
    await flushFrames(120)
    expect(focusOf().x).toBeCloseTo(50 / 150, 5)
  })

  it('reduced motion skips the glide: the projected target applies instantly', async () => {
    triggerMediaQuery('(prefers-reduced-motion: reduce)', true)
    const { getByTestId } = render(<PanHarness />)
    drag(getByTestId('pan-target'), [
      [150, 75, 0],
      [320, 75, 32],
    ])
    expect(focusOf().x).toBe(0) // already settled, no frames flushed
  })

  it('grabbing mid-glide cancels it: later frames do not move the focus', async () => {
    const { getByTestId } = render(<PanHarness />)
    drag(getByTestId('pan-target'), [
      [150, 75, 0],
      [320, 75, 32],
    ]) // flick
    // One glide frame lands, then the pointer grabs the image again.
    await flushFrames(2)
    const midGlide = focusOf().x

    const el = getByTestId('pan-target')
    fireEvent.pointerDown(el, {
      pointerId: 2,
      pointerType: 'mouse',
      clientX: 160,
      clientY: 75,
      timeStamp: rafNow,
    })
    fireEvent.pointerUp(el, { pointerId: 2, clientX: 160, clientY: 75, timeStamp: rafNow + 5 })
    const afterGrab = focusOf().x
    await flushFrames(60)
    expect(focusOf().x).toBe(afterGrab)
    // And the grab really interrupted a moving glide.
    expect(midGlide).not.toBe(0.5)
  })
})

describe('ctrl+wheel zoom (ADR 0006 §4)', () => {
  it('ctrl+wheel zooms exponentially, anchored at the cursor; plain wheel does nothing', async () => {
    render(<PanHarness />)
    const el = screen.getByTestId('pan-target')
    // Focus the shot first so the wheel surface exists (cover shot).
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 75 })
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 150, clientY: 75 })
    await flushFrames(1)

    const scaleOf = () => useCardStore.getState().card.showcase!.shots[0].scale
    const focusOf = () => useCardStore.getState().card.showcase!.shots[0].focus

    // Plain wheel: page scroll intent — the slot must not react.
    el.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -120, clientX: 225, clientY: 40, cancelable: true }),
    )
    expect(scaleOf()).toBeUndefined()
    // dispatchEvent resolves to "not canceled" — false means we claimed it.
    expect(
      el.dispatchEvent(
        new WheelEvent('wheel', {
          ctrlKey: true,
          deltaY: -120,
          clientX: 225,
          clientY: 40,
          cancelable: true,
        }),
      ),
    ).toBe(false)
    // exp(0.24) ≈ 1.27: one notch is a gentle zoom nudge.
    expect(scaleOf()).toBeCloseTo(Math.exp(0.24), 5)
    // Anchored: the content point under the cursor (x=75% into the slot)
    // stays under it, so focus moves toward the cursor.
    const fx = focusOf()!.x
    expect(fx).toBeGreaterThan(0.5)
    // A zoom back out returns scale to 1 and clears focus in the same burst.
    el.dispatchEvent(
      new WheelEvent('wheel', {
        ctrlKey: true,
        deltaY: 240,
        clientX: 225,
        clientY: 40,
        cancelable: true,
      }),
    )
    expect(scaleOf()).toBe(1)
  })

  it('wheel zoom is inactive for contain shots', async () => {
    function ContainHarness() {
      const shot = useCardStore((s) => s.card.showcase?.shots[0])
      const pan = useShotPan(shot?.id ?? '', 'contain', false, () => {})
      const { wheelElement } = pan
      return (
        <img
          ref={wheelElement}
          src={shot?.dataUrl ?? ''}
          data-testid="pan-target"
          {...pan.handlers}
          style={{ width: 300, height: 150, objectFit: 'contain' }}
        />
      )
    }
    render(<ContainHarness />)
    const el = screen.getByTestId('pan-target')
    el.dispatchEvent(
      new WheelEvent('wheel', {
        ctrlKey: true,
        deltaY: -120,
        clientX: 150,
        clientY: 75,
        cancelable: true,
      }),
    )
    expect(useCardStore.getState().card.showcase!.shots[0].scale).toBeUndefined()
  })
})
