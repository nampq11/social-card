// @vitest-environment jsdom
import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStudioShortcuts } from './use-studio-shortcuts';

describe('useStudioShortcuts', () => {
  it('Cmd/Ctrl+Z fires undo', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useStudioShortcuts({ onUndo, onRedo, onToggleInspector: vi.fn() }));

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('Cmd/Ctrl+Shift+Z fires redo', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    renderHook(() => useStudioShortcuts({ onUndo, onRedo, onToggleInspector: vi.fn() }));

    fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('Ctrl+Y fires redo (Windows convention)', () => {
    const onRedo = vi.fn();
    renderHook(() => useStudioShortcuts({ onUndo: vi.fn(), onRedo, onToggleInspector: vi.fn() }));

    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('Cmd/Ctrl+\\ and Cmd/Ctrl+B fire the inspector toggle', () => {
    const onToggleInspector = vi.fn();
    renderHook(() => useStudioShortcuts({ onUndo: vi.fn(), onRedo: vi.fn(), onToggleInspector }));

    fireEvent.keyDown(window, { key: '\\', metaKey: true });
    expect(onToggleInspector).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(onToggleInspector).toHaveBeenCalledTimes(2);
  });

  it('ignores shortcuts while typing in a text field', () => {
    const onUndo = vi.fn();
    const onToggleInspector = vi.fn();
    renderHook(() => useStudioShortcuts({ onUndo, onRedo: vi.fn(), onToggleInspector }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    // jsdom does not focus on focus() alone in keydown targets; dispatch on
    // the element so event.target is the field itself.
    fireEvent.keyDown(input, { key: 'z', metaKey: true });
    fireEvent.keyDown(input, { key: '\\', ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    expect(onToggleInspector).not.toHaveBeenCalled();

    input.remove();
  });

  it('ignores unrelated keys and modifiers', () => {
    const onUndo = vi.fn();
    renderHook(() => useStudioShortcuts({ onUndo, onRedo: vi.fn(), onToggleInspector: vi.fn() }));

    fireEvent.keyDown(window, { key: 'z' });
    fireEvent.keyDown(window, { key: 's', metaKey: true });
    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, altKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });
});
