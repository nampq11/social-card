// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { useMediaQuery } from './use-media-query';
import { triggerMediaQuery } from '../test/match-media';

const DESKTOP_QUERY = '(min-width: 1024px)';

describe('useMediaQuery', () => {
  it('starts from the stubbed media state (desktop shell in tests)', () => {
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY));
    expect(result.current).toBe(true);
  });

  it('re-renders when the media query flips', () => {
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY));

    act(() => triggerMediaQuery(DESKTOP_QUERY, false));

    expect(result.current).toBe(false);
  });
});
