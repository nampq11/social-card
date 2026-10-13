// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STORAGE_KEY,
  readOnboardingStatus,
  useOnboarding,
} from './onboarding';

describe('readOnboardingStatus', () => {
  it('reports a first-time visitor as new', () => {
    expect(readOnboardingStatus()).toBe('new');
  });

  it('restores a finished onboarding from localStorage', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"done"');
    expect(readOnboardingStatus()).toBe('done');
  });

  it('treats unknown or corrupt values as new', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'garbage{');
    expect(readOnboardingStatus()).toBe('new');
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"whatever"');
    expect(readOnboardingStatus()).toBe('new');
  });
});

describe('useOnboarding', () => {
  it('shows the welcome card only to first-time visitors', () => {
    const first = renderHook(() => useOnboarding());
    expect(first.result.current.isWelcomeOpen).toBe(true);

    first.unmount();

    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '"done"');
    const returning = renderHook(() => useOnboarding());
    expect(returning.result.current.isWelcomeOpen).toBe(false);
  });

  it('starting the tour closes the welcome card, opens the tour, and persists', () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => result.current.startTour());

    expect(result.current.isTourOpen).toBe(true);
    expect(result.current.isWelcomeOpen).toBe(false);
    expect(readOnboardingStatus()).toBe('done');
  });

  it('skipping the welcome card persists and never re-shows it', () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => result.current.dismissWelcome());

    expect(result.current.isWelcomeOpen).toBe(false);
    expect(result.current.isTourOpen).toBe(false);
    expect(readOnboardingStatus()).toBe('done');
  });

  it('ending the tour closes it for replays without forgetting the visitor', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.startTour());

    act(() => result.current.endTour());

    expect(result.current.isTourOpen).toBe(false);
    expect(readOnboardingStatus()).toBe('done');
  });
});
