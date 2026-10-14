// @vitest-environment jsdom
import { act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlash } from './use-flash'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useFlash', () => {
  it('auto-hides a flash after its duration', () => {
    const { result } = renderHook(() => useFlash<string | null>(null))

    act(() => result.current[1].flash('copied!', 3000))
    expect(result.current[0]).toBe('copied!')

    act(() => vi.advanceTimersByTime(3000))
    expect(result.current[0]).toBeNull()
  })

  it('a second flash cancels the first flash auto-hide', () => {
    const { result } = renderHook(() => useFlash<string | null>(null))

    act(() => result.current[1].flash('first', 3000))
    act(() => vi.advanceTimersByTime(1000))
    act(() => result.current[1].flash('second', 3000))

    // First timer fires at its original deadline; it must not clear 'second'.
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current[0]).toBe('second')
  })

  it('reports the initial value before any action', () => {
    const { result } = renderHook(() => useFlash<boolean>(false))
    expect(result.current[0]).toBe(false)
  })

  it('clears a pending auto-hide on unmount', () => {
    const { result, unmount } = renderHook(() => useFlash<string | null>(null))

    act(() => result.current[1].flash('bye', 3000))
    expect(vi.getTimerCount()).toBe(1)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
