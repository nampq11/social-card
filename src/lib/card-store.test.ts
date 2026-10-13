import { describe, expect, it, beforeEach } from 'vitest';
import { useCardStore } from './card-store';
import { DEFAULT_CARD_STATE } from '../constants/presets';

// History tests drive the store directly — no React, no provider.
const s = () => useCardStore.getState();

beforeEach(() => {
  // Factory-fresh state AND history (merge — actions live in the zustand
  // state object, replacing wholesale would wipe them). Deliberately not the
  // user-facing resetCard, which is itself an undoable edit now.
  useCardStore.setState({
    card: DEFAULT_CARD_STATE,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  });
});

describe('card-store history', () => {
  it('patchCard records one undo step and redo re-applies it', () => {
    s().patchCard({ theme: 'dark' });
    expect(s().card.theme).toBe('dark');
    expect(s().canUndo).toBe(true);

    s().undo();
    expect(s().card.theme).toBe(DEFAULT_CARD_STATE.theme);
    expect(s().canRedo).toBe(true);

    s().redo();
    expect(s().card.theme).toBe('dark');
  });

  it('coalesces a rapid single-key drag into one undo step', () => {
    // A slider drag fires dozens of patches; undo must not step through them.
    s().patchCard({ headlineSize: 30 });
    s().patchCard({ headlineSize: 36 });
    s().patchCard({ headlineSize: 42 });

    s().undo();
    expect(s().card.headlineSize).toBe(DEFAULT_CARD_STATE.headlineSize);
    expect(s().canUndo).toBe(false);
  });

  it('does not coalesce patches to different keys', () => {
    s().patchCard({ headline: 'a' });
    s().patchCard({ theme: 'dark' });

    s().undo();
    // Back to the state after the first patch only: headline edit survives,
    // the theme edit is what got reverted.
    expect(s().card.headline).toBe('a');
    expect(s().card.theme).toBe(DEFAULT_CARD_STATE.theme);
  });

  it('does not coalesce a multi-key patch (style presets apply as one step)', () => {
    s().patchCard({ theme: 'paper' });
    s().patchCard({ theme: 'dark', ratio: '16:9' });

    s().undo();
    expect(s().card.theme).toBe('paper');
    expect(s().card.ratio).toBe(DEFAULT_CARD_STATE.ratio);
  });

  it('a new edit after undo discards the redo stack', () => {
    s().patchCard({ theme: 'dark' });
    s().undo();
    expect(s().canRedo).toBe(true);

    s().patchCard({ theme: 'white' });
    expect(s().canRedo).toBe(false);
    s().redo();
    expect(s().card.theme).toBe('white');
  });

  it('resetCard is itself an undoable edit', () => {
    s().patchCard({ theme: 'dark', headline: 'changed' });

    s().resetCard();
    expect(s().card).toEqual(DEFAULT_CARD_STATE);
    expect(s().canUndo).toBe(true);

    s().undo();
    expect(s().card.headline).toBe('changed');
  });

  it('undo/redo at the boundary are safe no-ops', () => {
    s().undo();
    s().redo();
    expect(s().card).toEqual(DEFAULT_CARD_STATE);
    expect(s().canUndo).toBe(false);
    expect(s().canRedo).toBe(false);
  });

  it('caps the undo stack at 50 steps', () => {
    // Alternating key NAMES defeats coalescing (values are irrelevant —
    // the coalesce window is keyed by property name), so every patch is
    // one step.
    for (let i = 0; i < 60; i++) {
      s().patchCard(i % 2 === 0 ? { theme: 'dark' } : { ratio: '16:9' });
    }
    expect(s().past.length).toBe(50);

    // The oldest surviving entry is the 51st patch's predecessor state.
    for (let i = 0; i < 50; i++) s().undo();
    expect(s().canUndo).toBe(false);
    // State after the first ten patches: last theme patch was i=8, last
    // ratio patch was i=9.
    expect(s().card.theme).toBe('dark');
    expect(s().card.ratio).toBe('16:9');
  });
});
