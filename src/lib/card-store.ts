import { create } from 'zustand';
import type { CardState } from '../types';
import { DEFAULT_CARD_STATE } from '../constants/presets';

// The Card State — the complete editable model of one card (all Card Content
// fields plus style choices) — is owned by exactly this store with exactly
// two actions. UI-transient state (zoom, exporting, copied flag) deliberately
// stays out: this is a domain model, not a dumping ground (GLOSSARY.md).
interface CardStore {
  card: CardState;
  patchCard: (patch: Partial<CardState>) => void;
  resetCard: () => void;
}

export const useCardStore = create<CardStore>((set) => ({
  card: DEFAULT_CARD_STATE,
  patchCard: (patch) => set((state) => ({ card: { ...state.card, ...patch } })),
  resetCard: () => set({ card: DEFAULT_CARD_STATE }),
}));
