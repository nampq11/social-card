import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCardStore } from './card-store'
import { DEFAULT_SHOT_FOCUS, focusFromDrag } from './shot-fit'
import { useMediaQuery } from './use-media-query'
import type { ShotFit, ShotFocus } from '../types'

// One Screenshot Slot's pan gesture surface (ADR 0005): drag-always on
// hover-capable pointers, tap-to-select first on touch — so until the user
// explicitly arms a Shot, its gestures stay native (page/Bottom Sheet scroll
// is never hijacked). Panning is a cover-only affordance: a Fit (contain)
// Shot shows whole, with nothing to pan.
interface PanGesture {
  pointerId: number
  startX: number
  startY: number
  startFocus: ShotFocus
}

export function useShotPan(
  shotId: string,
  fit: ShotFit,
  selected: boolean,
  onSelect: (shotId: string) => void,
) {
  const setShotFocus = useCardStore((s) => s.setShotFocus)
  const hoverCapable = useMediaQuery('(hover: hover)')
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<PanGesture | null>(null)
  const tapStart = useRef<{ x: number; y: number } | null>(null)

  const cover = fit === 'cover'
  // Touch arms through selection; desktop pans from the first press. Only
  // the armed surface claims touch-action — an unarmed slot keeps native
  // scrolling, which is the whole point of the hybrid model.
  const interactive = cover && (hoverCapable || selected)

  const onPointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    tapStart.current = { x: event.clientX, y: event.clientY }
    if (!interactive) return
    const shot = useCardStore.getState().card.showcase?.shots.find((s) => s.id === shotId)
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocus: shot?.focus ?? DEFAULT_SHOT_FOCUS,
    }
    setDragging(true)
    // jsdom has no pointer capture; the real browser keeps moves flowing
    // outside the element while the finger/hand is down.
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
    const active = gesture.current
    if (!active || event.pointerId !== active.pointerId) return
    const el = event.currentTarget
    // The preview canvas is CSS-scaled (Fit-to-View); pointer px are screen
    // px, the math wants slot px.
    const rect = el.getBoundingClientRect()
    const scale = rect.width > 0 && el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1
    const next = focusFromDrag(
      active.startFocus,
      (event.clientX - active.startX) / scale,
      (event.clientY - active.startY) / scale,
      el.offsetWidth,
      el.offsetHeight,
      el.naturalWidth,
      el.naturalHeight,
      fit,
    )
    setShotFocus(shotId, next)
  }

  const endGesture = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (gesture.current?.pointerId === event.pointerId) {
      gesture.current = null
      setDragging(false)
      return
    }
    // No gesture was armed: a touch tap on an unarmed Shot selects it.
    const start = tapStart.current
    tapStart.current = null
    if (!cover || hoverCapable || selected || !start) return
    const moved = Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y)
    if (moved < 8) onSelect(shotId)
  }

  return {
    dragging,
    interactive,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  }
}
