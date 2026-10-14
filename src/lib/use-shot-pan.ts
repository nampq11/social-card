import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCardStore } from './card-store'
import {
  clampScale,
  DEFAULT_SHOT_FOCUS,
  focusForPinch,
  focusFromDrag,
  momentumFocus,
  springStep,
  trackVelocity,
  type ShotGeometry,
  type SpringState,
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
// Double-click zoom toggle (Photos' browse ↔ detail at the point).
const DOUBLE_CLICK_SCALE = 2
// A release below this speed is a deliberate rest, not a flick: pixel-level
// nudging must not coast (ADR 0006 §3 — momentum carries intent, not jitter).
const MOMENTUM_MIN_VELOCITY = 200
// ctrl+wheel sensitivity: one notch (deltaY 100) is a gentle multiplicative
// nudge — exp keeps the steps proportional to the current zoom.
const WHEEL_ZOOM_FACTOR = 0.002
// Two clicks within this window read as a double-click (desktop only).
const DOUBLE_CLICK_WINDOW_MS = 350
// A hover-pointer press that stays within this slop is a click, not a
// drag — it must reach the tap branch (select + double-click zoom).
const CLICK_SLOP_PX = 8

interface DragGesture {
  pointerId: number
  startX: number
  startY: number
  startFocus: ShotFocus
  moved: boolean
}

// Active pinch: two pointers, anchored at their midpoint (ADR 0006 §4).
interface PinchGesture {
  idA: number
  idB: number
  startDistance: number
  startMidpoint: { x: number; y: number }
  startFocus: ShotFocus
  startScale: number
}

const geometryOf = (el: HTMLImageElement): ShotGeometry => ({
  slotWidth: el.offsetWidth,
  slotHeight: el.offsetHeight,
  naturalWidth: el.naturalWidth,
  naturalHeight: el.naturalHeight,
})

// The preview canvas is CSS-scaled (Fit-to-View): screen px = layout px only
// at scale 1. Pointer input and the tracked velocity are screen px; the
// gesture math is slot layout px — this converts at the boundary.
const previewScaleOf = (el: HTMLImageElement) => {
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1
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
  // The last focus value the settle loop wrote; a frame that reads anything
  // else means an external write (pill clear, undo, Inspector) landed and
  // the glide must not fight it.
  const lastGlideWrite = useRef<ShotFocus | null>(null)

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

  // Stable identity so the wheel effect subscribes once per cover change.
  const getShot = useCallback(
    () => useCardStore.getState().card.showcase?.shots.find((s) => s.id === shotId),
    [shotId],
  )

  // The settle loop (ADR 0006 §3): focus glides into its projected target
  // while any rubber-band excess melts to zero — one critically damped
  // spring per axis (a flick's release velocity seeds it, so the handoff
  // has no kink), interruptible by the next pointer-down. Focus frames go
  // through the store, so export and undo see what the screen sees.
  const glide = (target: ShotFocus, seed: ShotFocus = { x: 0, y: 0 }) => {
    if (reducedMotion) {
      setShotFocus(shotId, target)
      applyOverdrag(null)
      return
    }
    stopGlide()
    let last = performance.now()
    lastGlideWrite.current = getShot()?.focus ?? DEFAULT_SHOT_FOCUS
    let springX = { value: lastGlideWrite.current.x, velocity: seed.x }
    let springY = { value: lastGlideWrite.current.y, velocity: seed.y }
    let springOverX: SpringState = { value: overdragRef.current?.x ?? 0, velocity: 0 }
    let springOverY: SpringState = { value: overdragRef.current?.y ?? 0, velocity: 0 }
    const step = (now: number) => {
      glideFrame.current = null
      const dtMs = Math.min(64, now - last)
      last = now
      const current = getShot()?.focus ?? DEFAULT_SHOT_FOCUS
      if (
        lastGlideWrite.current &&
        (Math.abs(current.x - lastGlideWrite.current.x) > 0.01 ||
          Math.abs(current.y - lastGlideWrite.current.y) > 0.01)
      ) {
        // Someone else owns the state now — abandon the settle.
        lastGlideWrite.current = null
        return
      }
      // Values re-read from the store each frame (it holds this loop's own
      // last write); the spring state carries the velocity forward.
      const next = {
        x: springStep(
          { value: current.x, velocity: springX.velocity },
          target.x,
          dtMs,
          GLIDE_RESPONSE,
        ),
        y: springStep(
          { value: current.y, velocity: springY.velocity },
          target.y,
          dtMs,
          GLIDE_RESPONSE,
        ),
      }
      const nextOver = {
        x: springStep(springOverX, 0, dtMs, GLIDE_RESPONSE),
        y: springStep(springOverY, 0, dtMs, GLIDE_RESPONSE),
      }
      const settled =
        Math.abs(next.x.value - target.x) < 0.001 &&
        Math.abs(next.y.value - target.y) < 0.001 &&
        Math.abs(next.x.velocity) < 0.05 &&
        Math.abs(next.y.velocity) < 0.05 &&
        Math.abs(nextOver.x.value) < 0.5 &&
        Math.abs(nextOver.y.value) < 0.5 &&
        Math.abs(nextOver.x.velocity) < 10 &&
        Math.abs(nextOver.y.velocity) < 10
      if (settled) {
        setShotFocus(shotId, target)
        lastGlideWrite.current = null
        applyOverdrag(null)
        return
      }
      springX = next.x
      springY = next.y
      springOverX = nextOver.x
      springOverY = nextOver.y
      setShotFocus(shotId, { x: next.x.value, y: next.y.value })
      lastGlideWrite.current = { x: next.x.value, y: next.y.value }
      applyOverdrag({ x: nextOver.x.value, y: nextOver.y.value })
      glideFrame.current = requestAnimationFrame(step)
    }
    glideFrame.current = requestAnimationFrame(step)
  }

  const beginPinchIfArmed = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (pinch.current !== null || pointers.current.size !== 2 || !interactive || !cover) return
    const [a, b] = [...pointers.current.values()]
    const rect = event.currentTarget.getBoundingClientRect()
    const shot = getShot()
    pinch.current = {
      idA: event.pointerId,
      idB: [...pointers.current.keys()].find((id) => id !== event.pointerId) ?? event.pointerId,
      startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      startMidpoint: midpointOf(a, b, rect),
      startFocus: shot?.focus ?? DEFAULT_SHOT_FOCUS,
      startScale: shot?.scale ?? 1,
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
    const shot = getShot()
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocus: shot?.focus ?? DEFAULT_SHOT_FOCUS,
      moved: false,
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
      const nextScale = clampScale(activePinch.startScale * (distance / activePinch.startDistance))
      setShotScale(shotId, nextScale)
      setShotFocus(
        shotId,
        focusForPinch(
          activePinch.startFocus,
          activePinch.startScale,
          nextScale,
          activePinch.startMidpoint,
          midpoint,
          geometryOf(el),
        ),
      )
      return
    }

    const active = gesture.current
    if (!active || event.pointerId !== active.pointerId) return
    if (
      !active.moved &&
      Math.abs(event.clientX - active.startX) + Math.abs(event.clientY - active.startY) >=
        CLICK_SLOP_PX
    )
      active.moved = true
    velocity.current = trackVelocity(
      velocity.current,
      event.clientX,
      event.clientY,
      event.timeStamp,
    )
    const el = event.currentTarget
    const previewScale = previewScaleOf(el)
    const dx = (event.clientX - active.startX) / previewScale
    const dy = (event.clientY - active.startY) / previewScale
    // Pointer deltas move the content 1:1; travel past an edge rubber-bands
    // (ADR 0006 §3) — focus pegs at the edge while the excess shows as a
    // transient translate on the image.
    const outcome = focusFromDrag(
      active.startFocus,
      dx,
      dy,
      geometryOf(el),
      clampScale(getShot()?.scale ?? 1),
    )
    setShotFocus(shotId, outcome.focus)
    applyOverdrag(outcome.overdrag.x !== 0 || outcome.overdrag.y !== 0 ? outcome.overdrag : null)
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
      if (active.moved) {
        // Momentum (ADR 0006 §3): the release velocity projects where the
        // content coasts to a stop; a rubber-band excess springs home in the
        // same settle. Reduced motion lands instantly.
        const released = getShot()?.focus ?? active.startFocus
        const v = velocity.current
        const flick =
          Math.abs(v?.velocityX ?? 0) >= MOMENTUM_MIN_VELOCITY ||
          Math.abs(v?.velocityY ?? 0) >= MOMENTUM_MIN_VELOCITY
        const el = event.currentTarget
        const coast = momentumFocus(
          released,
          v?.velocityX ?? 0,
          v?.velocityY ?? 0,
          previewScaleOf(el),
          geometryOf(el),
          clampScale(getShot()?.scale ?? 1),
        )
        glide(flick ? coast.focus : released, flick ? coast.velocity : { x: 0, y: 0 })
        velocity.current = null
        return
      }
      // A press that never left the click slop is a click, not a drag: it
      // falls through to the tap branch so select (the pill, ADR 0006 §2)
      // and the double-click zoom (§4) stay reachable on hover-capable
      // pointers — drag-always is untouched because a real drag returns
      // above.
    }
    // No gesture (unarmed surface) or a click-without-drag lands here: a
    // tap selects the Shot — any Fit, either pointer class — so the on-shot
    // pill (ADR 0006 §2) is reachable everywhere. Real drags return in the
    // gesture branch above.
    const start = tapStart.current
    tapStart.current = null
    if (!start) return
    const moved = Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y)
    if (moved >= CLICK_SLOP_PX) return
    const now = event.timeStamp
    const isDoubleClick = hoverCapable && now - lastTapAt.current < DOUBLE_CLICK_WINDOW_MS
    lastTapAt.current = isDoubleClick ? 0 : now
    if (isDoubleClick && cover) {
      // Desktop zoom toggle (ADR 0006 §4): anchored at the click point. Touch
      // never pays the double-tap latency trap on its arming tap.
      const el = event.currentTarget
      const currentScale = clampScale(getShot()?.scale ?? 1)
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
            getShot()?.focus ?? DEFAULT_SHOT_FOCUS,
            currentScale,
            nextScale,
            fraction,
            fraction,
            geometryOf(el),
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

  // ctrl+wheel zoom (ADR 0006 §4), anchored at the cursor. React's root
  // wheel listener is passive, so preventDefault — keeping the browser's own
  // page-zoom from firing — needs a native non-passive listener on the img.
  const wheelElement = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    const el = wheelElement.current
    if (!el || !cover) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const shot = getShot()
      const currentScale = clampScale(shot?.scale ?? 1)
      const nextScale = clampScale(currentScale * Math.exp(-event.deltaY * WHEEL_ZOOM_FACTOR))
      setShotScale(shotId, nextScale)
      if (nextScale === currentScale) return
      // The cursor fraction doubles as start and end anchor: the content
      // point under it stays under it (focusForPinch with a zero midpoint
      // travel).
      const anchor = {
        x: rect.width > 0 ? (event.clientX - rect.x) / rect.width : 0.5,
        y: rect.height > 0 ? (event.clientY - rect.y) / rect.height : 0.5,
      }
      setShotFocus(
        shotId,
        focusForPinch(
          shot?.focus ?? DEFAULT_SHOT_FOCUS,
          currentScale,
          nextScale,
          anchor,
          anchor,
          geometryOf(el),
        ),
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // getShot is a per-render closure that reads fresh state at event time;
    // listing it re-subscribes the native listener on unrelated renders.
  }, [cover, setShotScale, setShotFocus, shotId, getShot])

  return {
    dragging,
    interactive,
    overdrag,
    wheelElement,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  }
}
