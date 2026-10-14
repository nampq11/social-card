// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ONBOARDING_STORAGE_KEY,
  readOnboardingStatus,
  readShotFitTourStatus,
  SHOT_FIT_TOUR_STORAGE_KEY,
  useOnboarding,
  useShotFitTour,
} from './onboarding'

describe('readOnboardingStatus', () => {
  it('reports a first-time visitor as new', () => {
    expect(readOnboardingStatus()).toBe('new')
  })

  it('restores a finished onboarding from localStorage', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"done"')
    expect(readOnboardingStatus()).toBe('done')
  })

  it('treats unknown or corrupt values as new', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'garbage{')
    expect(readOnboardingStatus()).toBe('new')
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"whatever"')
    expect(readOnboardingStatus()).toBe('new')
  })
})

describe('useOnboarding', () => {
  it('shows the welcome card only to first-time visitors', () => {
    const first = renderHook(() => useOnboarding())
    expect(first.result.current.isWelcomeOpen).toBe(true)

    first.unmount()

    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"done"')
    const returning = renderHook(() => useOnboarding())
    expect(returning.result.current.isWelcomeOpen).toBe(false)
  })

  it('starting the tour closes the welcome card, opens the tour, and persists', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => result.current.startTour())

    expect(result.current.isTourOpen).toBe(true)
    expect(result.current.isWelcomeOpen).toBe(false)
    expect(readOnboardingStatus()).toBe('done')
  })

  it('skipping the welcome card persists and never re-shows it', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => result.current.dismissWelcome())

    expect(result.current.isWelcomeOpen).toBe(false)
    expect(result.current.isTourOpen).toBe(false)
    expect(readOnboardingStatus()).toBe('done')
  })

  it('ending the tour closes it for replays without forgetting the visitor', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => result.current.startTour())

    act(() => result.current.endTour())

    expect(result.current.isTourOpen).toBe(false)
    expect(readOnboardingStatus()).toBe('done')
  })
})

describe('useShotFitTour', () => {
  // The auto-fire persists on first trigger; each case starts from a clean
  // slate so the "returning visitor" state is set explicitly per test.
  beforeEach(() => window.localStorage.clear())

  it('auto-fires once, at the first Shot after first-run onboarding is done', async () => {
    const { result, rerender } = renderHook(
      ({ armed, onboardingDone }: { armed: boolean; onboardingDone: boolean }) =>
        useShotFitTour(armed, onboardingDone),
      { initialProps: { armed: false, onboardingDone: true } },
    )
    expect(result.current.isTourOpen).toBe(false)

    // jsdom's rAF never ticks while an act scope is open, so the wait (and
    // the deferred fire) happens outside act; the trailing act flushes it.
    act(() => rerender({ armed: true, onboardingDone: true }))
    await new Promise((r) => setTimeout(r, 50))
    await act(async () => {})

    expect(result.current.isTourOpen).toBe(true)
    expect(readShotFitTourStatus()).toBe('done')
  })

  it('waits while the welcome card is still up, then fires when it clears', async () => {
    const { result, rerender } = renderHook(
      ({ armed, onboardingDone }: { armed: boolean; onboardingDone: boolean }) =>
        useShotFitTour(armed, onboardingDone),
      { initialProps: { armed: true, onboardingDone: false } },
    )
    expect(result.current.isTourOpen).toBe(false)

    act(() => rerender({ armed: true, onboardingDone: true }))
    await new Promise((r) => setTimeout(r, 50))
    await act(async () => {})

    expect(result.current.isTourOpen).toBe(true)
  })

  it('never restarts for a returning visitor', () => {
    window.localStorage.setItem(SHOT_FIT_TOUR_STORAGE_KEY, '"done"')
    const { result } = renderHook(() => useShotFitTour(true, true))

    expect(result.current.isTourOpen).toBe(false)
  })

  it('ending closes it for replays; replaying reopens without touching persistence', () => {
    // A replay implies a fire already happened; start from that state.
    window.localStorage.setItem(SHOT_FIT_TOUR_STORAGE_KEY, '"done"')
    const { result } = renderHook(() => useShotFitTour(true, true))
    act(() => result.current.replayTour())
    expect(result.current.isTourOpen).toBe(true)

    act(() => result.current.endTour())

    expect(result.current.isTourOpen).toBe(false)
    expect(readShotFitTourStatus()).toBe('done')
  })
})
