import { create } from 'zustand'
import type { CardState, CardType } from '../types'
import { DEFAULT_CARD_STATE } from '../constants/presets'

// The Card State — the complete editable model of one card (all Card Content
// fields plus style choices) — is owned by exactly this store. UI-transient
// state (zoom, exporting, copied flag) deliberately stays out: this is a
// domain model, not a dumping ground (GLOSSARY.md).
//
// Edits are undoable: every non-coalesced patch pushes the previous card onto
// the past stack. A slider drag fires dozens of patches per second, so a
// single-key patch that follows another patch to the same key within the
// coalesce window replaces the present state instead of stacking a step —
// one drag, one undo. Multi-key patches (style presets, reset) always get
// their own step.
interface CardStore {
  card: CardState
  past: CardState[]
  future: CardState[]
  canUndo: boolean
  canRedo: boolean
  patchCard: (patch: Partial<CardState>) => void
  resetCard: () => void
  undo: () => void
  redo: () => void
  switchCardType: () => void
  addShot: (dataUrl: string) => void
}

const HISTORY_CAP = 50
const COALESCE_WINDOW_MS = 600

// Stable identity for Shots and Annotations (GLOSSARY.md): unique per
// creation, never derived from list position, so references survive any
// rearrangement of the arrays.
let nextId = 0
const createId = (prefix: string) => `${prefix}-${++nextId}`

// Bookkeeping shared by every dedicated action below: the previous card
// Bookkeeping shared by every dedicated action below: the previous card
// becomes exactly one undo step and the redo stack is discarded.
const undoStep = (state: { card: CardState; past: CardState[] }, card: CardState) => ({
  card,
  past: [...state.past, state.card].slice(-HISTORY_CAP),
  future: [],
  canUndo: true,
  canRedo: false,
})

// Edit rhythm is UI-transient — module-scoped, not part of the model.
// Edit rhythm is UI-transient — module-scoped, not part of the model.
let lastEdit: { key: string | null; at: number } | null = null

export const useCardStore = create<CardStore>((set) => ({
  card: DEFAULT_CARD_STATE,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  patchCard: (patch) =>
    set((state) => {
      const keys = Object.keys(patch)
      const key = keys.length === 1 ? keys[0] : null
      const now = Date.now()
      const coalesce =
        key !== null && lastEdit?.key === key && now - lastEdit.at < COALESCE_WINDOW_MS
      lastEdit = { key, at: now }

      return coalesce
        ? { card: { ...state.card, ...patch } }
        : {
            card: { ...state.card, ...patch },
            past: [...state.past, state.card].slice(-HISTORY_CAP),
            future: [],
            canUndo: true,
            canRedo: false,
          }
    }),

  resetCard: () =>
    set((state) => {
      lastEdit = null
      return {
        card: DEFAULT_CARD_STATE,
        past: [...state.past, state.card].slice(-HISTORY_CAP),
        future: [],
        canUndo: true,
        canRedo: false,
      }
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state
      lastEdit = null
      const previous = state.past[state.past.length - 1]
      return {
        card: previous,
        past: state.past.slice(0, -1),
        future: [state.card, ...state.future],
        canUndo: state.past.length > 1,
        canRedo: true,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      lastEdit = null
      const [next, ...rest] = state.future
      return {
        card: next,
        past: [...state.past, state.card].slice(-HISTORY_CAP),
        future: rest,
        canUndo: true,
        canRedo: rest.length > 0,
      }
    }),

  // Each Shot upload is its own atomic undo step, like any dedicated edit.
  addShot: (dataUrl: string) =>
    set((state) => {
      // The collage holds at most three Shots (hero + two details); a
      // refused upload changes nothing and costs no undo step.
      if ((state.card.showcase?.shots.length ?? 0) >= 3) return state
      lastEdit = null
      const shot = { id: createId('shot'), dataUrl }
      const showcase = state.card.showcase ?? { shots: [], annotations: [] }
      return undoStep(state, {
        ...state.card,
        showcase: { ...showcase, shots: [...showcase.shots, shot] },
      })
    }),

  // The type switch is a dedicated atomic action (ADR 0004): always its own
  // The type switch is a dedicated atomic action (ADR 0004): always its own
  // undo step — never coalesced with adjacent edits — and non-destructive in
  // both directions: Quote fields and the showcase nest are left untouched.
  switchCardType: () =>
    set((state) => {
      lastEdit = null
      const cardType: CardType = state.card.cardType === 'showcase' ? 'quote' : 'showcase'
      // Showcase is always 1:1; leaving does not restore the pre-excursion
      // ratio — ratio is shared style, not per-type content (issue #33).
      const ratio = cardType === 'showcase' ? '1:1' : state.card.ratio
      return undoStep(state, { ...state.card, cardType, ratio })
    }),
}))
