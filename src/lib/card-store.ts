import { create } from 'zustand'
import type { Annotation, AnnotationSide, CardState, CardType } from '../types'
import type { ShotFit, ShotFocus } from '../types'
import { clampFocus, shotFit } from './shot-fit'
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
  switchCardType: (next: CardType) => void
  addShot: (dataUrl: string) => void
  removeShot: (shotId: string) => void
  setShotFit: (shotId: string, fit: ShotFit) => void
  setShotFocus: (shotId: string, focus: ShotFocus) => void
  resetShotFocus: (shotId: string) => void
  addAnnotation: (input: { shotId: string; text: string; side: AnnotationSide }) => void
  updateAnnotation: (
    annotationId: string,
    patch: Partial<Pick<Annotation, 'shotId' | 'text' | 'side'>>,
  ) => void
  removeAnnotation: (annotationId: string) => void
}

const HISTORY_CAP = 50
const COALESCE_WINDOW_MS = 600

// The collage holds at most three Shots (hero + two details). The store
// refuses Shot adds past it and the Inspector disables its add control at
// the same constant, so the two can never drift apart.
export const MAX_SHOTS = 3

// Stable identity for Shots and Annotations (GLOSSARY.md): unique per
// creation, never derived from list position, so references survive any
// rearrangement of the arrays.
let nextId = 0
const createId = (prefix: string) => `${prefix}-${++nextId}`

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
      // A refused add changes nothing and costs no undo step.
      if ((state.card.showcase?.shots.length ?? 0) >= MAX_SHOTS) return state
      lastEdit = null
      const shot = { id: createId('shot'), dataUrl }
      const showcase = state.card.showcase ?? { shots: [], annotations: [] }
      return undoStep(state, {
        ...state.card,
        showcase: { ...showcase, shots: [...showcase.shots, shot] },
      })
    }),

  // Annotations follow their Shot (issue #33): deleting a shot deletes its
  // annotation within the very same undo step, so one Cmd+Z restores both.
  removeShot: (shotId) =>
    set((state) => {
      const showcase = state.card.showcase
      if (!showcase || !showcase.shots.some((shot) => shot.id === shotId)) return state
      lastEdit = null
      return undoStep(state, {
        ...state.card,
        showcase: {
          shots: showcase.shots.filter((shot) => shot.id !== shotId),
          annotations: showcase.annotations.filter((annotation) => annotation.shotId !== shotId),
        },
      })
    }),

  // Fit is a discrete user choice (Fill vs Fit switcher): always its own
  // atomic undo step, never coalesced with adjacent edits.
  setShotFit: (shotId, fit) =>
    set((state) => {
      const shot = state.card.showcase?.shots.find((shot) => shot.id === shotId)
      // Same-fit requests and unknown shots change nothing and cost no step.
      if (!shot || shotFit(shot) === fit) return state
      lastEdit = null
      const shots = state.card.showcase!.shots.map((shot) =>
        shot.id === shotId ? { ...shot, fit } : shot,
      )
      return undoStep(state, { ...state.card, showcase: { ...state.card.showcase!, shots } })
    }),

  // Focus comes from drag gestures — dozens per second — so edits to the
  // same Shot coalesce on the shared window (one drag, one undo), mirroring
  // patchCard's single-key rhythm. Focus is clamped on write: state never
  // carries an out-of-range or Fit-irrelevant anchor.
  setShotFocus: (shotId, focus) =>
    set((state) => {
      const shot = state.card.showcase?.shots.find((shot) => shot.id === shotId)
      if (!shot) return state
      const clamped = clampFocus(focus, shotFit(shot))
      const key = `shotFocus:${shotId}`
      const now = Date.now()
      const coalesce = lastEdit?.key === key && now - lastEdit.at < COALESCE_WINDOW_MS
      lastEdit = { key, at: now }
      const shots = state.card.showcase!.shots.map((shot) =>
        shot.id === shotId ? { ...shot, focus: clamped } : shot,
      )
      const next = { ...state.card, showcase: { ...state.card.showcase!, shots } }
      return coalesce ? { card: next } : undoStep(state, next)
    }),
  // [Đặt lại] on the pan overlay: back to the absent-field default (the
  // original object-top render), which is a state without a focus value.
  resetShotFocus: (shotId) =>
    set((state) => {
      const shot = state.card.showcase?.shots.find((shot) => shot.id === shotId)
      if (!shot?.focus) return state
      lastEdit = null
      const shots = state.card.showcase!.shots.map((shot) => {
        if (shot.id !== shotId) return shot
        const { focus: _dropped, ...rest } = shot
        return rest
      })
      return undoStep(state, { ...state.card, showcase: { ...state.card.showcase!, shots } })
    }),
  // Annotations bind to Shots, never to Screenshot Slots (issue #33) — a
  // shot carries at most one, so the edit is refused while it has one.
  addAnnotation: (input) =>
    set((state) => {
      const showcase = state.card.showcase
      const shotExists = showcase?.shots.some((shot) => shot.id === input.shotId)
      const alreadyAnnotated = showcase?.annotations.some(
        (annotation) => annotation.shotId === input.shotId,
      )
      if (!showcase || !shotExists || alreadyAnnotated) return state
      lastEdit = null
      const annotation = { id: createId('annotation'), ...input }
      return undoStep(state, {
        ...state.card,
        showcase: { ...showcase, annotations: [...showcase.annotations, annotation] },
      })
    }),

  // List-only editing per the spec (text, side, target shot, delete). A
  // retarget obeys the same one-annotation-per-shot cap as addAnnotation.
  // Typing is a drag rhythm in disguise — keystrokes land dozens per second
  // — so text-only patches coalesce on the shared window (one burst, one
  // undo, ADR 0005 decision 5); side and retarget are discrete choices and
  // always get their own step.
  updateAnnotation: (annotationId, patch) =>
    set((state) => {
      const showcase = state.card.showcase
      const annotation = showcase?.annotations.find((a) => a.id === annotationId)
      if (!showcase || !annotation) return state
      const targetId = patch.shotId ?? annotation.shotId
      const targetFree =
        showcase.shots.some((shot) => shot.id === targetId) &&
        showcase.annotations.every((a) => a.id === annotationId || a.shotId !== targetId)
      if (!targetFree) return state
      const key = 'shotId' in patch || 'side' in patch ? null : `annotationText:${annotationId}`
      const now = Date.now()
      const coalesce =
        key !== null && lastEdit?.key === key && now - lastEdit.at < COALESCE_WINDOW_MS
      lastEdit = { key, at: now }
      const next = {
        ...state.card,
        showcase: {
          ...showcase,
          annotations: showcase.annotations.map((a) =>
            a.id === annotationId ? { ...a, ...patch } : a,
          ),
        },
      }
      return coalesce ? { card: next } : undoStep(state, next)
    }),

  removeAnnotation: (annotationId) =>
    set((state) => {
      const showcase = state.card.showcase
      if (!showcase?.annotations.some((a) => a.id === annotationId)) return state
      lastEdit = null
      return undoStep(state, {
        ...state.card,
        showcase: {
          ...showcase,
          annotations: showcase.annotations.filter((a) => a.id !== annotationId),
        },
      })
    }),

  // The type switch is a dedicated atomic action (ADR 0004): always its own
  // undo step — never coalesced with adjacent edits — and non-destructive in
  // both directions: Quote fields and the showcase nest are left untouched.
  switchCardType: (next: CardType) =>
    set((state) => {
      // Requesting the current Card Type changes nothing and costs no step.
      if (next === state.card.cardType) return state
      lastEdit = null
      // Showcase is always 1:1; leaving does not restore the pre-excursion
      // ratio — ratio is shared style, not per-type content (issue #33).
      const ratio = next === 'showcase' ? '1:1' : state.card.ratio
      return undoStep(state, { ...state.card, cardType: next, ratio })
    }),
}))
