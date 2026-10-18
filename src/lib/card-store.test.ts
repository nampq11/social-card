import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useCardStore } from './card-store'
import { DEFAULT_CARD_STATE } from '../constants/presets'

// History tests drive the store directly — no React, no provider.
const s = () => useCardStore.getState()

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
  })
})

describe('card-store history', () => {
  it('patchCard records one undo step and redo re-applies it', () => {
    s().patchCard({ theme: 'dark' })
    expect(s().card.theme).toBe('dark')
    expect(s().canUndo).toBe(true)

    s().undo()
    expect(s().card.theme).toBe(DEFAULT_CARD_STATE.theme)
    expect(s().canRedo).toBe(true)

    s().redo()
    expect(s().card.theme).toBe('dark')
  })

  it('coalesces a rapid single-key drag into one undo step', () => {
    // A slider drag fires dozens of patches; undo must not step through them.
    s().patchCard({ headlineSize: 30 })
    s().patchCard({ headlineSize: 36 })
    s().patchCard({ headlineSize: 42 })

    s().undo()
    expect(s().card.headlineSize).toBe(DEFAULT_CARD_STATE.headlineSize)
    expect(s().canUndo).toBe(false)
  })

  it('does not coalesce patches to different keys', () => {
    s().patchCard({ headline: 'a' })
    s().patchCard({ theme: 'dark' })

    s().undo()
    // Back to the state after the first patch only: headline edit survives,
    // the theme edit is what got reverted.
    expect(s().card.headline).toBe('a')
    expect(s().card.theme).toBe(DEFAULT_CARD_STATE.theme)
  })

  it('does not coalesce a multi-key patch (style presets apply as one step)', () => {
    s().patchCard({ theme: 'paper' })
    s().patchCard({ theme: 'dark', ratio: '16:9' })

    s().undo()
    expect(s().card.theme).toBe('paper')
    expect(s().card.ratio).toBe(DEFAULT_CARD_STATE.ratio)
  })

  it('a new edit after undo discards the redo stack', () => {
    s().patchCard({ theme: 'dark' })
    s().undo()
    expect(s().canRedo).toBe(true)

    s().patchCard({ theme: 'white' })
    expect(s().canRedo).toBe(false)
    s().redo()
    expect(s().card.theme).toBe('white')
  })

  it('resetCard is itself an undoable edit', () => {
    s().patchCard({ theme: 'dark', headline: 'changed' })

    s().resetCard()
    expect(s().card).toEqual(DEFAULT_CARD_STATE)
    expect(s().canUndo).toBe(true)

    s().undo()
    expect(s().card.headline).toBe('changed')
  })

  it('undo/redo at the boundary are safe no-ops', () => {
    s().undo()
    s().redo()
    expect(s().card).toEqual(DEFAULT_CARD_STATE)
    expect(s().canUndo).toBe(false)
    expect(s().canRedo).toBe(false)
  })

  it('caps the undo stack at 50 steps', () => {
    // Alternating key NAMES defeats coalescing (values are irrelevant —
    // the coalesce window is keyed by property name), so every patch is
    // one step.
    for (let i = 0; i < 60; i++) {
      s().patchCard(i % 2 === 0 ? { theme: 'dark' } : { ratio: '16:9' })
    }
    expect(s().past.length).toBe(50)

    // The oldest surviving entry is the 51st patch's predecessor state.
    for (let i = 0; i < 50; i++) s().undo()
    expect(s().canUndo).toBe(false)
    // State after the first ten patches: last theme patch was i=8, last
    // ratio patch was i=9.
    expect(s().card.theme).toBe('dark')
    expect(s().card.ratio).toBe('16:9')
  })
})

describe('card-store card type switch', () => {
  // The switch contracts enter from a Quote card; the factory is a Showcase.
  beforeEach(() => {
    useCardStore.setState({
      card: { ...DEFAULT_CARD_STATE, cardType: 'quote' },
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    })
  })

  it('switchCardType switches to the requested type as exactly one undo step', () => {
    s().patchCard({ headline: 'changed' })
    const before = s().card

    s().switchCardType('showcase')
    expect(s().card.cardType).toBe('showcase')
    expect(s().past.length).toBe(2)

    s().undo()
    expect(s().card).toEqual(before)
  })

  it('switchCardType never coalesces with an adjacent same-key edit', () => {
    // A slider-style patch right before the switch must not absorb it.
    s().patchCard({ ratio: '16:9' })
    s().patchCard({ ratio: '4:5' })
    s().switchCardType('showcase')

    s().undo()
    expect(s().card.ratio).toBe('4:5')
    expect(s().card.cardType).toBe('quote')
  })

  it('entering showcase forces ratio 1:1; leaving does not restore it', () => {
    // Ratio is shared style, not per-type content: the pre-excursion ratio
    // is deliberately lost (spec decision, issue #33).
    s().patchCard({ ratio: '16:9' })

    s().switchCardType('showcase')
    expect(s().card.ratio).toBe('1:1')

    s().switchCardType('quote')
    expect(s().card.ratio).toBe('1:1')
  })

  it('two consecutive switches are two undo steps', () => {
    s().switchCardType('showcase')
    s().switchCardType('quote')
    expect(s().card.cardType).toBe('quote')

    s().undo()
    expect(s().card.cardType).toBe('showcase')
  })

  it('requesting the current card type is a no-op costing no undo step', () => {
    s().patchCard({ headline: 'changed' })
    const before = s().card
    const stepsBefore = s().past.length

    s().switchCardType('quote')

    expect(s().card).toEqual(before)
    expect(s().past.length).toBe(stepsBefore)
  })
})

describe('card-store showcase content', () => {
  // These contracts build a collage from empty; the factory carries the
  // demo Shot, so the nest starts cleared.
  beforeEach(() => {
    useCardStore.setState({
      card: { ...DEFAULT_CARD_STATE, showcase: { shots: [], annotations: [] } },
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    })
  })

  it('addShot caps at three shots and a refused shot costs no undo step', () => {
    for (const n of [1, 2, 3]) s().addShot(`data:${n}`)
    const stepsBefore = s().past.length

    s().addShot('data:4')

    expect(s().card.showcase?.shots.map((shot) => shot.dataUrl)).toEqual([
      'data:1',
      'data:2',
      'data:3',
    ])
    expect(s().past.length).toBe(stepsBefore)
  })

  it('addAnnotation anchors to a shot; at most one annotation per shot', () => {
    s().addShot('data:1')
    const shot = s().card.showcase!.shots[0]

    s().addAnnotation({ shotId: shot.id, text: 'Màn hình chính', side: 'top' })
    expect(s().card.showcase?.annotations).toEqual([
      { id: expect.any(String), shotId: shot.id, text: 'Màn hình chính', side: 'top' },
    ])

    // A second annotation for the same shot is refused and costs no step.
    const stepsBefore = s().past.length
    s().addAnnotation({ shotId: shot.id, text: 'b', side: 'left' })
    expect(s().card.showcase?.annotations).toHaveLength(1)
    expect(s().past.length).toBe(stepsBefore)
  })

  it('addAnnotation for an unknown shot is a no-op', () => {
    s().addAnnotation({ shotId: 'missing', text: 'b', side: 'left' })
    expect(s().card.showcase?.annotations ?? []).toEqual([])
    expect(s().past.length).toBe(0)
  })

  it('removeShot deletes its annotation in the same undo step', () => {
    s().addShot('data:1')
    s().addShot('data:2')
    const [shotA, shotB] = s().card.showcase!.shots
    s().addAnnotation({ shotId: shotA.id, text: 'a', side: 'left' })
    s().addAnnotation({ shotId: shotB.id, text: 'b', side: 'right' })

    s().removeShot(shotA.id)
    expect(s().card.showcase?.shots.map((shot) => shot.id)).toEqual([shotB.id])
    expect(s().card.showcase?.annotations.map((a) => a.text)).toEqual(['b'])

    // One Cmd+Z restores both the shot and its annotation.
    s().undo()
    expect(s().card.showcase?.shots.map((shot) => shot.id)).toEqual([shotA.id, shotB.id])
    expect(s().card.showcase?.annotations.map((a) => a.text)).toEqual(['a', 'b'])
  })

  it('updateAnnotation edits text and side, and retargets only to a free shot', () => {
    s().addShot('data:1')
    s().addShot('data:2')
    const [shotA, shotB] = s().card.showcase!.shots
    s().addAnnotation({ shotId: shotA.id, text: 'a', side: 'left' })
    const annotation = s().card.showcase!.annotations[0]

    s().updateAnnotation(annotation.id, { text: 'Tổng quan', side: 'top' })
    expect(s().card.showcase?.annotations).toEqual([
      { id: annotation.id, shotId: shotA.id, text: 'Tổng quan', side: 'top' },
    ])

    // Retargeting to a free shot follows the shot, not the slot.
    s().updateAnnotation(annotation.id, { shotId: shotB.id })
    expect(s().card.showcase?.annotations[0].shotId).toBe(shotB.id)

    // Retargeting to an already-annotated shot is refused.
    s().addShot('data:3')
    const shotC = s().card.showcase!.shots[2]
    s().addAnnotation({ shotId: shotC.id, text: 'c', side: 'left' })
    const stepsBefore = s().past.length
    s().updateAnnotation(annotation.id, { shotId: shotC.id })
    expect(s().card.showcase?.annotations[0].shotId).toBe(shotB.id)
    expect(s().past.length).toBe(stepsBefore)
  })

  it('coalesces rapid typing on one annotation into a single undo step', () => {
    s().addShot('data:1')
    const shot = s().card.showcase!.shots[0]
    s().addAnnotation({ shotId: shot.id, text: '', side: 'left' })
    const annotation = s().card.showcase!.annotations[0]

    // A burst of keystrokes lands inside the coalesce window (decision 5).
    s().updateAnnotation(annotation.id, { text: 'G' })
    s().updateAnnotation(annotation.id, { text: 'Gi' })
    s().updateAnnotation(annotation.id, { text: 'Ghi' })

    s().undo()
    expect(s().card.showcase!.annotations[0].text).toBe('')
  })

  it('a side switch after typing starts its own undo step', () => {
    s().addShot('data:1')
    const shot = s().card.showcase!.shots[0]
    s().addAnnotation({ shotId: shot.id, text: '', side: 'left' })
    const annotation = s().card.showcase!.annotations[0]

    s().updateAnnotation(annotation.id, { text: 'Ghi chú' })
    s().updateAnnotation(annotation.id, { side: 'top' })

    s().undo()
    expect(s().card.showcase!.annotations[0].side).toBe('left')
    expect(s().card.showcase!.annotations[0].text).toBe('Ghi chú')
    s().undo()
    expect(s().card.showcase!.annotations[0].text).toBe('')
  })

  it('removeAnnotation deletes exactly its own annotation, undoable in one step', () => {
    s().addShot('data:1')
    const shot = s().card.showcase!.shots[0]
    s().addAnnotation({ shotId: shot.id, text: 'a', side: 'top' })
    const annotation = s().card.showcase!.annotations[0]

    s().removeAnnotation(annotation.id)
    expect(s().card.showcase?.annotations).toEqual([])

    s().undo()
    expect(s().card.showcase?.annotations).toHaveLength(1)
  })

  it('switching is non-destructive both ways: quote and showcase content both survive', () => {
    s().patchCard({ headline: 'Em vừa được tậu đất:', sublines: 'a\nb' })
    s().switchCardType('showcase')
    s().addShot('data:1')
    s().addAnnotation({ shotId: s().card.showcase!.shots[0].id, text: 'x', side: 'top' })

    s().switchCardType('quote')
    expect(s().card.cardType).toBe('quote')
    expect(s().card.headline).toBe('Em vừa được tậu đất:')
    expect(s().card.sublines).toBe('a\nb')
    expect(s().card.showcase?.shots).toHaveLength(1)

    s().switchCardType('showcase')
    expect(s().card.showcase?.annotations.map((a) => a.text)).toEqual(['x'])
  })

  it('addShot appends shots in upload order with unique stable ids', () => {
    // Array order is upload order: the first Shot renders in the Hero Slot.
    s().addShot('data:hero')
    s().addShot('data:detail-a')

    const shots = s().card.showcase?.shots ?? []
    expect(shots.map((shot) => shot.dataUrl)).toEqual(['data:hero', 'data:detail-a'])
    expect(new Set(shots.map((shot) => shot.id)).size).toBe(2)
    expect(s().card.showcase?.annotations).toEqual([])
  })
})

describe('card-store shot fit & focus (issue #34)', () => {
  // Every test starts from a showcase card holding exactly one Shot.
  const withOneShot = () => {
    s().switchCardType('showcase')
    s().addShot('data:1')
    return s().card.showcase!.shots[0]
  }

  it('setShotFit is a dedicated atomic undo step', () => {
    const shot = withOneShot()

    s().setShotFit(shot.id, 'contain')
    expect(s().card.showcase!.shots[0].fit).toBe('contain')

    s().undo()
    expect(s().card.showcase!.shots[0].fit).toBeUndefined()
  })

  it('writing a fit override the shot already stores costs no undo step', () => {
    const shot = withOneShot()
    s().setShotFit(shot.id, 'contain') // an override, stored
    const stepsBefore = s().past.length

    s().setShotFit(shot.id, 'contain')

    expect(s().past.length).toBe(stepsBefore)
  })

  it('focus edits to different shots do not coalesce', () => {
    s().switchCardType('showcase')
    s().addShot('data:1')
    s().addShot('data:2')
    const [shotA, shotB] = s().card.showcase!.shots

    s().setShotFocus(shotA.id, { x: 0.1, y: 0.1 })
    s().setShotFocus(shotB.id, { x: 0.2, y: 0.2 })

    s().undo()
    expect(s().card.showcase!.shots[1].focus).toBeUndefined()
    expect(s().card.showcase!.shots[0].focus).toEqual({ x: 0.1, y: 0.1 })
  })

  it('setShotFit for an unknown shot is a no-op', () => {
    withOneShot()
    const stepsBefore = s().past.length

    s().setShotFit('missing', 'contain')

    expect(s().card.showcase!.shots[0].fit).toBeUndefined()
    expect(s().past.length).toBe(stepsBefore)
  })

  it('a focus drag coalesces into one undo step', () => {
    const shot = withOneShot()
    const stepsBefore = s().past.length

    s().setShotFocus(shot.id, { x: 0.1, y: 0.2 })
    s().setShotFocus(shot.id, { x: 0.3, y: 0.4 })
    s().setShotFocus(shot.id, { x: 0.6, y: 0.8 })

    expect(s().card.showcase!.shots[0].focus).toEqual({ x: 0.6, y: 0.8 })
    expect(s().past.length).toBe(stepsBefore + 1)
    s().undo()
    expect(s().card.showcase!.shots[0].focus).toBeUndefined()
  })

  it('setShotFocus for an unknown shot is a no-op', () => {
    withOneShot()
    const stepsBefore = s().past.length

    s().setShotFocus('missing', { x: 0.5, y: 0.5 })

    expect(s().card.showcase!.shots[0].focus).toBeUndefined()
    expect(s().past.length).toBe(stepsBefore)
  })
})

describe('card-store shot Scale + adjustments reset (issue #38)', () => {
  const withOneShot = () => {
    s().switchCardType('showcase')
    s().addShot('data:1')
    return s().card.showcase!.shots[0]
  }

  it('setShotScale clamps into 1..4 and coalesces a pinch into one undo step', () => {
    vi.useFakeTimers()
    try {
      const shot = withOneShot()
      const stepsBefore = s().past.length

      s().setShotScale(shot.id, 3)
      s().setShotScale(shot.id, 99) // clamps to the max
      s().setShotScale(shot.id, 0.5) // clamps to the min
      const afterPinch = s().card.showcase!.shots[0]
      expect(afterPinch.scale).toBe(1)
      expect(s().past.length).toBe(stepsBefore + 1)

      vi.advanceTimersByTime(700)
      s().setShotScale(shot.id, 2)
      expect(s().past.length).toBe(stepsBefore + 2)

      // The first undo pops the post-expiry window (back to scale 1); the
      // second returns to the unzoomed shot.
      s().undo()
      expect(s().card.showcase!.shots[0].scale).toBe(1)
      s().undo()
      expect(s().card.showcase!.shots[0].scale).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('scale edits to different shots do not coalesce', () => {
    vi.useFakeTimers()
    try {
      const [a, b] = [withOneShot(), (s().addShot('data:2'), s().card.showcase!.shots[1])]
      const stepsBefore = s().past.length

      s().setShotScale(a.id, 2)
      s().setShotScale(b.id, 2)
      expect(s().past.length).toBe(stepsBefore + 2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('setShotZoom coalesces a pinch-sized burst into one undo step', () => {
    vi.useFakeTimers()
    try {
      const shot = withOneShot()
      const stepsBefore = s().past.length

      // A pinch fires dozens of scale+focus writes per second; one gesture
      // must cost one step, not two per event.
      for (let i = 0; i < 30; i++) s().setShotZoom(shot.id, 1 + i * 0.1, { x: 0.1, y: 0.2 })
      expect(s().past.length).toBe(stepsBefore + 1)
      expect(s().card.showcase!.shots[0].scale).toBeCloseTo(3.9, 5)

      s().undo()
      const restored = s().card.showcase!.shots[0]
      expect(restored.scale).toBeUndefined()
      expect(restored.focus).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a zoom gesture after a focus drag starts its own undo step', () => {
    vi.useFakeTimers()
    try {
      const shot = withOneShot()
      s().setShotFocus(shot.id, { x: 0.4, y: 0.5 })
      const afterDrag = s().past.length

      s().setShotZoom(shot.id, 2, { x: 0.4, y: 0.5 })
      expect(s().past.length).toBe(afterDrag + 1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('clearShotAdjustments wipes fit override, focus and scale in one atomic undo', () => {
    const shot = withOneShot()
    // Focus first: with cover still effective the anchor is stored as-is.
    s().setShotFocus(shot.id, { x: 0.1, y: 0.9 })
    s().setShotFit(shot.id, 'contain')
    s().setShotScale(shot.id, 2.5)
    const stepsBefore = s().past.length

    s().clearShotAdjustments(shot.id)
    const cleaned = s().card.showcase!.shots[0]
    expect(cleaned.fit).toBeUndefined()
    expect(cleaned.focus).toBeUndefined()
    expect(cleaned.scale).toBeUndefined()
    expect(s().past.length).toBe(stepsBefore + 1)

    s().undo()
    const restored = s().card.showcase!.shots[0]
    expect(restored.fit).toBe('contain')
    expect(restored.focus).toEqual({ x: 0.1, y: 0.9 })
    expect(restored.scale).toBe(2.5)
  })

  it('clearShotAdjustments on an unadjusted shot is a no-op costing no step', () => {
    const shot = withOneShot()
    const stepsBefore = s().past.length

    s().clearShotAdjustments(shot.id)
    expect(s().past.length).toBe(stepsBefore)
  })
})

describe('card-store overrides vs the derived default (issue #38)', () => {
  it('an explicit fit request overrides the derived default even when it equals the accessor default', () => {
    s().switchCardType('showcase')
    s().addShot('data:1')
    const shot = s().card.showcase!.shots[0]
    // Auto-fit derives contain at render (no stored field); the user's
    // explicit cover choice must win and be stored — this is the pill's
    // "Đầy khung" on an auto-contained shot.
    s().setShotFit(shot.id, 'cover')
    expect(s().card.showcase!.shots[0].fit).toBe('cover')
  })

  it('writing the override that is already stored is still a no-op', () => {
    s().switchCardType('showcase')
    s().addShot('data:1')
    const shot = s().card.showcase!.shots[0]
    const stepsBefore = s().past.length

    s().setShotFit(shot.id, 'cover')
    s().setShotFit(shot.id, 'cover')
    expect(s().past.length).toBe(stepsBefore + 1)
  })
})

describe('card-store definition content (issue #63)', () => {
  // These contracts enter from a Quote card with no definition nest, so
  // materialization is observable; the factory itself carries the demo one.
  beforeEach(() => {
    useCardStore.setState({
      card: { ...DEFAULT_CARD_STATE, cardType: 'quote', definition: undefined },
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    })
  })

  it('materializes the nest on the first edit as one undo step', () => {
    s().patchDefinition({ term: 'Tự học' })

    // The materialized nest carries empty-string baselines for the required
    // fields the patch didn't touch — '' renders as absent, like headline.
    expect(s().card.definition).toEqual({ term: 'Tự học', observation: '', punchline: '' })
    expect(s().canUndo).toBe(true)

    // One step back: the card never carried a definition nest.
    s().undo()
    expect(s().card.definition).toBeUndefined()
  })

  it('coalesces a typing burst on one field into a single undo step', () => {
    s().patchDefinition({ term: 'T' })
    s().patchDefinition({ term: 'Tự' })
    s().patchDefinition({ term: 'Tự học' })

    expect(s().past.length).toBe(1)
    s().undo()
    expect(s().card.definition).toBeUndefined()
  })

  it('keeps bursts on different fields as separate undo steps', () => {
    s().patchDefinition({ term: 'Tự học' })
    s().patchDefinition({ observation: 'a' })
    s().patchDefinition({ observation: 'ab' })

    // The observation burst folds; the term edit before it does not.
    s().undo()
    expect(s().card.definition?.observation).toBe('')
    expect(s().card.definition?.term).toBe('Tự học')
    s().undo()
    expect(s().card.definition).toBeUndefined()
  })

  it('coalesces a scrim drag into one undo step, then expires like any drag', () => {
    vi.useFakeTimers()
    try {
      s().patchDefinition({ scrimOpacity: 0.5 })
      s().patchDefinition({ scrimOpacity: 0.6 })
      s().patchDefinition({ scrimOpacity: 0.7 })
      expect(s().past.length).toBe(1)

      vi.advanceTimersByTime(700)
      s().patchDefinition({ scrimOpacity: 0.8 })
      expect(s().past.length).toBe(2)

      // The first undo pops the post-expiry window (back to 0.7); the
      // second returns to the never-touched card with no scrim stored.
      s().undo()
      expect(s().card.definition?.scrimOpacity).toBe(0.7)
      s().undo()
      expect(s().card.definition?.scrimOpacity).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('applies a multi-field patch as its own atomic undo step', () => {
    s().patchDefinition({ term: 'Tự học', punchline: 'Câu chốt' })

    expect(s().past.length).toBe(1)
    s().undo()
    expect(s().card.definition).toBeUndefined()
  })

  it('switching is non-destructive: definition content survives round trips', () => {
    s().patchDefinition({ term: 'Tự học', scrimOpacity: 0.3 })
    s().switchCardType('definition')
    expect(s().card.cardType).toBe('definition')

    s().switchCardType('showcase')
    s().switchCardType('quote')
    expect(s().card.cardType).toBe('quote')
    expect(s().card.definition).toMatchObject({ term: 'Tự học', scrimOpacity: 0.3 })

    // The definition switch leaves the shared ratio untouched: the layout
    // is ratio-agnostic and the control stays honest (only Showcase pins).
    s().switchCardType('definition')
    expect(s().card.ratio).toBe(DEFAULT_CARD_STATE.ratio)
  })
})
