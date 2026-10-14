import { describe, expect, it, beforeEach } from 'vitest'
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
  it('switchCardType toggles cardType as exactly one undo step', () => {
    s().patchCard({ headline: 'changed' })
    const before = s().card

    s().switchCardType()
    expect(s().card.cardType).toBe('showcase')
    expect(s().past.length).toBe(2)

    s().undo()
    expect(s().card).toEqual(before)
  })

  it('switchCardType never coalesces with an adjacent same-key edit', () => {
    // A slider-style patch right before the switch must not absorb it.
    s().patchCard({ ratio: '16:9' })
    s().patchCard({ ratio: '4:5' })
    s().switchCardType()

    s().undo()
    expect(s().card.ratio).toBe('4:5')
    expect(s().card.cardType).toBe('quote')
  })

  it('entering showcase forces ratio 1:1; leaving does not restore it', () => {
    // Ratio is shared style, not per-type content: the pre-excursion ratio
    // is deliberately lost (spec decision, issue #33).
    s().patchCard({ ratio: '16:9' })

    s().switchCardType()
    expect(s().card.ratio).toBe('1:1')

    s().switchCardType()
    expect(s().card.ratio).toBe('1:1')
  })

  it('two consecutive switches are two undo steps', () => {
    s().switchCardType()
    s().switchCardType()
    expect(s().card.cardType).toBe('quote')

    s().undo()
    expect(s().card.cardType).toBe('showcase')
  })
})

describe('card-store showcase content', () => {
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
