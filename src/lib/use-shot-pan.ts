import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCardStore } from './card-store'
import {
  clampScale,
  dampedStep,
  DEFAULT_SHOT_FOCUS,
  focusForPinch,
  projectedFocus,
  rubberbandDelta,
  trackVelocity,
  type VelocityState,
} from './shot-fit'
import { useMediaQuery } from './use-media-query'
import type { ShotFit, ShotFocus } from '../types'

// One Screenshot Slot's pan/zoom gesture surface (ADR 0005; physics per
// ADR 0006 §3-4): drag-always on hover-capable pointers, tap-to-select first
// on touch — so until the user explicitly arms a Shot, its gestures stay
// native (page/Bottom Sheet scroll is never hijacked). Panning and zooming
// are cover-only affordances: a Fit (contain) Shot shows whole, with nothing
// to steer. Overdrags rubber-band past the edge (store focus stays clamped;
// the excess is a transient translate), releases carry momentum into the
// projected resting focus, settles are critically damped — unless
// prefers-reduced-motion, which applies targets instantly.

// Apple's settle parameters for repositioning: damping 1.0, response 0.3s.
const GLIDE_RESPONSE = 0.3
// Rubber-band softness (Apple's constant): resistance grows with depth.
const RUBBERBAND_CONSTANT = 0.55
// Double-click zoom toggle (Photos' browse ↔ detail at the point).
const DOUBLE_CLICK_SCALE = 2
// A release below this speed is a deliberate rest, not a flick: pixel-level
// nudging must not coast (ADR 0006 §3 — momentum carries intent, not jitter).
const MOMENTUM_MIN_VELOCITY = 200
// Two clicks within this window read as a double-click (desktop only).
const DOUBLE_CLICK_WINDOW_MS = 350

interface DragGesture {
  pointerId: number
  startX: number
  startY: number
  startFocus: ShotFocus
}

// Active pinch: two pointers, anchored at their midpoint (ADR 0006 §4).
interface PinchGesture {
  idA: number
  idB: number
  startDistance: number
  startMidpoint: { x: number; y: number }
  startFocus: ShotFocus
  startZoom: number
}

const midpointOf = (a: { x: number; y: number }, b: { x: number; y: number }, rect: DOMRect) => ({
  x: rect.width > 0 ? ((a.x + b.x) / 2 - rect.x) / rect.width : 0.5,
  y: rect.height > 0 ? ((a.y + b.y) / 2 - rect.y) / rect.height : 0.5,
})

export function useShotPan(
  shotId: string,
  fit: ShotFit,
  selected: boolean,
  onSelect: (shotId: string) => void,
) {
  const setShotFocus = useCardStore((s) => s.setShotFocus)
  const setShotScale = useCardStore((s) => s.setShotScale)
  const hoverCapable = useMediaQuery('(hover: hover)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [dragging, setDragging] = useState(false)
  // Transient rubber-band excess in px, applied as a translate — the store's
  // focus domain stays 0..1 (ADR 0005's clamp contract) while the visual
  // follows the finger with progressive resistance. The ref mirrors the state
  // for reads from events and the rAF settle loop (never during render).
  const [overdrag, setOverdrag] = useState<{ x: number; y: number } | null>(null)
  const overdragRef = useRef<{ x: number; y: number } | null>(null)
  const applyOverdrag = (next: { x: number; y: number } | null) => {
    overdragRef.current = next
    setOverdrag(next)
  }
  const gesture = useRef<DragGesture | null>(null)
  const pinch = useRef<PinchGesture | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const tapStart = useRef<{ x: number; y: number } | null>(null)
  const lastTapAt = useRef(0)
  const velocity = useRef<VelocityState | null>(null)
  const glideFrame = useRef<number | null>(null)

  const cover = fit === 'cover'
  // Touch arms through selection; desktop pans from the first press. Only
  // the armed surface claims touch-action — an unarmed slot keeps native
  // scrolling, which is the whole point of the hybrid model.
  const interactive = cover && (hoverCapable || selected)

  const stopGlide = () => {
    if (glideFrame.current !== null) {
      cancelAnimationFrame(glideFrame.current)
      glideFrame.current = null
    }
  }

  const shotIn = () => useCardStore.getState().card.showcase?.shots.find((s) => s.id === shotId)

  // The settle loop (ADR 0006 §3): focus glides into its projected target
  // while any rubber-band excess melts to zero — one critically damped loop,
  // interruptible by the next pointer-down. Focus frames go through the
  // store, so export and undo see what the screen sees.
  const glide = (target: ShotFocus) => {
    if (reducedMotion) {
      setShotFocus(shotId, target)
      applyOverdrag(null)
      return
    }
    stopGlide()
    let last = performance.now()
    const step = (now: number) => {
      glideFrame.current = null
      const dtMs = Math.min(64, now - last)
      last = now
      const current = shotIn()?.focus ?? DEFAULT_SHOT_FOCUS
      const currentOver = overdragRef.current ?? { x: 0, y: 0 }
      const next = {
        x: dampedStep(current.x, target.x, dtMs, GLIDE_RESPONSE),
        y: dampedStep(current.y, target.y, dtMs, GLIDE_RESPONSE),
      }
      const nextOver = {
        x: dampedStep(currentOver.x, 0, dtMs, GLIDE_RESPONSE),
        y: dampedStep(currentOver.y, 0, dtMs, GLIDE_RESPONSE),
      }
      const settled =
        Math.abs(next.x - target.x) < 0.001 &&
        Math.abs(next.y - target.y) < 0.001 &&
        Math.abs(nextOver.x) < 0.5 &&
        Math.abs(nextOver.y) < 0.5
      if (settled) {
        setShotFocus(shotId, target)
        applyOverdrag(null)
        return
      }
      setShotFocus(shotId, next)
      applyOverdrag(nextOver)
      glideFrame.current = requestAnimationFrame(step)
    }
    glideFrame.current = requestAnimationFrame(step)
  }

  // Where a release with this velocity coasts to (ADR 0006 §3): the
  // projection per axis against that axis's zoomed overflow.
  const momentumTargets = (
    el: HTMLImageElement,
    velocity: VelocityState | null,
    from: ShotFocus,
  ): ShotFocus => {
    const rect = el.getBoundingClientRect()
    const scale = rect.width > 0 && el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1
    const coverScale = Math.max(
      el.offsetWidth / el.naturalWidth,
      el.offsetHeight / el.naturalHeight,
    )
    const zoom = clampScale(shotIn()?.scale ?? 1)
    return {
      x: projectedFocus(
        from.x,
        velocity?.velocityX ?? 0,
        el.naturalWidth * coverScale * zoom - el.offsetWidth / scale,
      ),
      y: projectedFocus(
        from.y,
        velocity?.velocityY ?? 0,
        el.naturalHeight * coverScale * zoom - el.offsetHeight / scale,
      ),
    }
  }

  const beginPinchIfArmed = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (pinch.current !== null || pointers.current.size !== 2 || !interactive || !cover) return
    const [a, b] = [...pointers.current.values()]
    const rect = event.currentTarget.getBoundingClientRect()
    const shot = shotIn()
    pinch.current = {
      idA: event.pointerId,
      idB: [...pointers.current.keys()].find((id) => id !== event.pointerId) ?? event.pointerId,
      startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      startMidpoint: midpointOf(a, b, rect),
      startFocus: shot?.focus ?? DEFAULT_SHOT_FOCUS,
      startZoom: shot?.scale ?? 1,
    }
    gesture.current = null
    setDragging(false)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    tapStart.current = { x: event.clientX, y: event.clientY }
    // A new touch interrupts whatever the image was doing (ADR 0006 §3 — the
    // gesture and the thought happen in parallel): any settle is grabbable.
    stopGlide()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    beginPinchIfArmed(event)
    if (pinch.current) return
    if (!interactive) return
    const shot = shotIn()
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocus: shot?.focus ?? DEFAULT_SHOT_FOCUS,
    }
    velocity.current = null
    setDragging(true)
    // jsdom has no pointer capture; the real browser keeps moves flowing
    // outside the element while the finger/hand is down.
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const activePinch = pinch.current
    if (
      activePinch &&
      (event.pointerId === activePinch.idA || event.pointerId === activePinch.idB)
    ) {
      const [a, b] = [...pointers.current.values()]
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const midpoint = midpointOf(a, b, rect)
      const nextZoom = clampScale(activePinch.startZoom * (distance / activePinch.startDistance))
      setShotScale(shotId, nextZoom)
      setShotFocus(
        shotId,
        focusForPinch(
          activePinch.startFocus,
          activePinch.startZoom,
          nextZoom,
          activePinch.startMidpoint,
          midpoint,
          el.offsetWidth,
          el.offsetHeight,
          el.naturalWidth,
          el.naturalHeight,
        ),
      )
      return
    }

    const active = gesture.current
    if (!active || event.pointerId !== active.pointerId) return
    velocity.current = trackVelocity(
      velocity.current,
      event.clientX,
      event.clientY,
      event.timeStamp,
    )
    const el = event.currentTarget
    // The preview canvas is CSS-scaled (Fit-to-View); pointer px are screen
    // px, the math wants slot px.
    const rect = el.getBoundingClientRect()
    const scale = rect.width > 0 && el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1
    const coverScale = Math.max(
      el.offsetWidth / el.naturalWidth,
      el.offsetHeight / el.naturalHeight,
    )
    const zoom = clampScale(shotIn()?.scale ?? 1)
    const overflowX = el.naturalWidth * coverScale * zoom - el.offsetWidth
    const overflowY = el.naturalHeight * coverScale * zoom - el.offsetHeight
    const dx = (event.clientX - active.startX) / scale
    const dy = (event.clientY - active.startY) / scale
    // Pointer deltas move the content 1:1; the travel past an edge is
    // rubber-banded (ADR 0006 §3) — focus pegs at the edge while the excess
    // shows as a transient translate on the image.
    const axis = (focus: number, delta: number, overflow: number, dimension: number) => {
      if (overflow <= 0) return { focus, over: 0 }
      const raw = focus * overflow - delta
      if (raw < 0) return { focus: 0, over: rubberbandDelta(-raw, dimension, RUBBERBAND_CONSTANT) }
      if (raw > overflow)
        return { focus: 1, over: -rubberbandDelta(raw - overflow, dimension, RUBBERBAND_CONSTANT) }
      return { focus: raw / overflow, over: 0 }
    }
    const nextX = axis(active.startFocus.x, dx, overflowX, el.offsetWidth)
    const nextY = axis(active.startFocus.y, dy, overflowY, el.offsetHeight)
    setShotFocus(shotId, { x: nextX.focus, y: nextY.focus })
    applyOverdrag(nextX.over !== 0 || nextY.over !== 0 ? { x: nextX.over, y: nextY.over } : null)
  }

  const endGesture = (event: ReactPointerEvent<HTMLImageElement>) => {
    pointers.current.delete(event.pointerId)
    if (
      pinch.current &&
      (event.pointerId === pinch.current.idA || event.pointerId === pinch.current.idB)
    ) {
      // A pinch ends when either finger lifts; the zoom and anchor it wrote
      // are already committed frames — nothing to settle.
      pinch.current = null
      return
    }
    const active = gesture.current
    if (active?.pointerId === event.pointerId) {
      gesture.current = null
      setDragging(false)
      // Momentum (ADR 0006 §3): the release velocity projects where the
      // content coasts to a stop; a rubber-band excess springs home in the
      // same settle. Reduced motion lands instantly.
      const released = shotIn()?.focus ?? active.startFocus
      const v = velocity.current
      const flick =
        Math.abs(v?.velocityX ?? 0) >= MOMENTUM_MIN_VELOCITY ||
        Math.abs(v?.velocityY ?? 0) >= MOMENTUM_MIN_VELOCITY
      glide(flick ? momentumTargets(event.currentTarget, v, released) : released)
      velocity.current = null
      return
    }
    // No gesture was armed: a tap selects the Shot — any Fit, either pointer
    // class — so the on-shot pill (ADR 0006 §2) is reachable everywhere.
    // Drag-always on hover-capable pointers is unaffected: a drag arms on
    // pointer-down and never reaches this branch.
    const start = tapStart.current
    tapStart.current = null
    if (!start) return
    const moved = Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y)
    if (moved >= 8) return
    const now = event.timeStamp
    const isDoubleClick = hoverCapable && now - lastTapAt.current < DOUBLE_CLICK_WINDOW_MS
    lastTapAt.current = isDoubleClick ? 0 : now
    if (isDoubleClick && cover) {
      // Desktop zoom toggle (ADR 0006 §4): anchored at the click point. Touch
      // never pays the double-tap latency trap on its arming tap.
      const el = event.currentTarget
      const currentScale = clampScale(shotIn()?.scale ?? 1)
      const nextScale = currentScale > 1 ? 1 : DOUBLE_CLICK_SCALE
      const rect = el.getBoundingClientRect()
      const fraction = {
        x: rect.width > 0 ? (event.clientX - rect.x) / rect.width : 0.5,
        y: rect.height > 0 ? (event.clientY - rect.y) / rect.height : 0.5,
      }
      if (nextScale > 1) {
        setShotScale(shotId, nextScale)
        setShotFocus(
          shotId,
          focusForPinch(
            shotIn()?.focus ?? DEFAULT_SHOT_FOCUS,
            currentScale,
            nextScale,
            fraction,
            fraction,
            el.offsetWidth,
            el.offsetHeight,
            el.naturalWidth,
            el.naturalHeight,
          ),
        )
      } else {
        setShotScale(shotId, 1)
      }
      return
    }
    if (selected) return
    onSelect(shotId)
  }

  return {
    dragging,
    interactive,
    overdrag,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  }
}
