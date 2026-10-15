import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  SHEET_CANVAS_GAP_PX,
  SHEET_MIN_CHROME_PX,
  rubberbandDistance,
  sheetExpandedPx,
  snapSheetTarget,
  springStep,
} from './sheet-drag'

// Below this travel a pointer sequence is a tap, not a drag (gesture hysteresis).
const TAP_THRESHOLD_PX = 10

/** jsdom implements no pointer capture; in browsers a dead pointer id is
 * rejected (InvalidPointerId) — both must degrade to an uncaptured drag. */
function takePointerCapture(el: HTMLElement, pointerId: number) {
  if (typeof el.setPointerCapture !== 'function') return
  try {
    el.setPointerCapture(pointerId)
  } catch {
    // The pointer is already gone; the release handlers will no-op.
  }
}
// Velocity is measured over a short trailing window of pointer positions.
const VELOCITY_WINDOW_MS = 100

interface DragState {
  /** Pull-down offset: 0 = expanded, maxOffset = peeked. */
  offset: number
  maxOffset: number
  expandedPx: number
  /** DOM-measured chrome height: top of the scrollable content in the sheet. */
  contentTop: number
  velocity: number
  animating: boolean
  pointerId: number
  startY: number
  startOffset: number
  moved: number
  /** True once this gesture owns the pointer stream (explicit capture). */
  captured: boolean
  history: { t: number; y: number }[]
}

/**
 * Bottom-sheet gesture for the Mobile Shell: the sheet tracks the pointer
 * 1:1 (rubber-banded past its two resting points), and on release projects
 * the pointer velocity to pick a resting point, springing there with that
 * velocity carried over (Apple, "Designing Fluid Interfaces").
 *
 * The per-frame output is one transform written straight to the DOM — the
 * sheet is one physical plane (grabber → header → tabs → content, iOS HIG).
 * React state is only the settled `expanded` flag the UI Copy needs. The
 * peek resting point is measured from the DOM (top of the scrollable
 * content), so the peeked sheet shows exactly its chrome — no control is
 * ever half-clipped at rest. The canvas reserve (padding = the sheet's
 * coverage plus breathing room) is written when a resting point is
 * committed — on release from the projected destination, so the card refit
 * runs concurrent with the spring and the two surfaces land together; on
 * toggle/cancel; re-asserted at settle — never per frame: per-frame layout
 * writes starved iOS 18 WebKit's commit pipeline and the screen replayed
 * stale drag frames (#53). Mid-drag the card keeps its last committed
 * sizing; at every committed rest Fit-to-View re-splits the viewport with
 * the sheet, so the card is fully visible (ADR 0002 addendum) instead of
 * hiding behind the expanded one.
 */
export function useSheetDrag(
  sheetRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
) {
  const [expanded, setExpanded] = useState(false)
  const drag = useRef<DragState>({
    offset: Number.POSITIVE_INFINITY,
    maxOffset: 0,
    expandedPx: 0,
    contentTop: SHEET_MIN_CHROME_PX,
    velocity: 0,
    animating: false,
    pointerId: -1,
    startY: 0,
    startOffset: 0,
    moved: 0,
    captured: false,
    history: [],
  }).current
  const rafId = useRef<number | null>(null)

  /** The canvas reserve for the sheet's coverage. Written when a resting
   * point is COMMITTED — at release the projected destination is passed in,
   * so the card refit runs concurrent with the spring and the two surfaces
   * land together — and re-derived at rest (settle, measure); never per
   * frame: per-frame layout writes (this padding) starved iOS 18 WebKit's
   * commit pipeline during drags and the screen replayed stale frames —
   * the on-device HUD showed sane DOM geometry while the paint displayed
   * earlier drag positions (#53). Fit-to-View refits off each
   * ResizeObserver tick a value change fires. */
  const writeReserve = useCallback(
    (coverageOffsetPx?: number) => {
      const canvas = canvasRef.current
      if (canvas) {
        const coverage = coverageOffsetPx ?? drag.offset
        canvas.style.paddingBottom = `${Math.max(
          0,
          Math.round(drag.expandedPx - coverage + SHEET_CANVAS_GAP_PX),
        )}px`
      }
    },
    [canvasRef, drag],
  )

  const writePosition = useCallback(() => {
    const sheet = sheetRef.current
    // translate3d, not translateY: the 3d form keeps the sheet on its own
    // composited layer through the per-frame writes, so the compositor
    // swaps the sheet atomically instead of re-tiling inline content.
    const transform = `translate3d(0, ${drag.offset}px, 0)`
    if (sheet) sheet.style.transform = transform
  }, [drag, sheetRef])

  const cancelSpring = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    drag.animating = false
  }, [drag])

  /** Measures the two resting points from the live DOM, then re-clamps. */
  const measure = useCallback(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    drag.expandedPx = sheetExpandedPx(window.innerHeight)
    // Peek rests exactly at the top of the scrollable content: the chrome
    // above it (grabber + header + tabs) shows in full, nothing half-clipped.
    drag.contentTop = Math.max(
      SHEET_MIN_CHROME_PX,
      contentRef.current?.offsetTop ?? SHEET_MIN_CHROME_PX,
    )
    drag.maxOffset = Math.max(0, drag.expandedPx - drag.contentTop)
    sheet.style.height = `${drag.expandedPx}px`
    // Resting state invariant:
    // When the sheet is at rest (not actively dragged and not mid-spring),
    // its offset rests cleanly at its committed target: 0 if expanded,
    // maxOffset if peeked. This correctly re-derives the resting peek on
    // late layout changes (font swaps, dynamic content) and viewport
    // height changes (orientation change, URL bar collapse), while
    // mid-drag frames preserve user tracking clamped to [0, maxOffset].
    // Mid-spring, the spring owns both writes: the setExpanded re-render
    // runs measure synchronously right after release, and re-clamping
    // there would teleport rubber-banded releases to their bound and
    // re-derive the reserve from the transient mid-flight offset. The
    // bounds refreshed above still apply; the settle frame re-asserts
    // the invariant.
    if (drag.animating) return
    const isDragging = drag.pointerId !== -1
    if (!isDragging) {
      drag.offset = expanded ? 0 : drag.maxOffset
    } else {
      drag.offset = Math.min(Math.max(0, drag.offset), drag.maxOffset)
    }
    // The resting offset just re-derived above (peek on late layout
    // changes, viewport height changes) drives both writes: the transform
    // and the canvas reserve.
    writePosition()
    writeReserve()
  }, [contentRef, drag, expanded, sheetRef, writePosition, writeReserve])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    const content = contentRef.current
    const section = sheetRef.current
    if (!content || !section) return
    // jsdom has no ResizeObserver: tests keep the mount computation only.
    if (typeof ResizeObserver === 'undefined') return
    // The chrome above the content changes height after mount (web fonts
    // swapping in, late reflow, a chrome row re-rendering), and a window
    // resize never fires for that. The content is flex-1, so its box moves
    // inversely with the chrome; the section catches chrome changes that
    // leave the content box untouched. Either is the "re-measure" signal.
    const observer = new ResizeObserver(() => measure())
    observer.observe(content)
    observer.observe(section)
    return () => observer.disconnect()
  }, [measure, contentRef, sheetRef])

  useEffect(() => {
    const onResize = () => {
      cancelSpring()
      measure()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [cancelSpring, measure])

  useEffect(() => cancelSpring, [cancelSpring])

  // Breakpoint crossings unmount the sheet (mobile → desktop): give the
  // canvas its class padding back, or the inline reserve would stick.
  useEffect(() => {
    const canvas = canvasRef.current
    return () => {
      if (canvas) canvas.style.paddingBottom = ''
    }
  }, [canvasRef])

  const springTo = useCallback(
    (target: number, initialVelocity: number) => {
      cancelSpring()
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        drag.offset = target
        drag.velocity = 0
        writePosition()
        writeReserve()
        return
      }
      drag.animating = true
      drag.velocity = initialVelocity
      // The resting point is already decided here (release projection,
      // toggle, cancel): commit its reserve NOW so the card refit runs
      // concurrent with the spring and the surfaces land together, instead
      // of the card catching up a beat after the sheet stops. The settle
      // frame re-asserts it — the same value, so no second refit fires,
      // unless a resize changed the bounds mid-spring.
      writeReserve(target)
      let last = performance.now()
      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.064)
        last = now
        const step = springStep(drag.offset, drag.velocity, target, dt)
        drag.offset = step.position
        drag.velocity = step.velocity
        const settled = Math.abs(target - drag.offset) < 0.5 && Math.abs(drag.velocity) < 20
        if (settled) {
          drag.offset = target
          drag.velocity = 0
          drag.animating = false
          rafId.current = null
          // Rest reached: re-assert the reserve from the settled offset —
          // normally the same value the release committed (no second refit
          // fires); different only if a resize changed the bounds
          // mid-spring, in which case this is the catch-up write.
          writePosition()
          writeReserve()
          return
        }
        writePosition()
        rafId.current = requestAnimationFrame(frame)
      }
      rafId.current = requestAnimationFrame(frame)
    },
    [cancelSpring, drag, writePosition, writeReserve],
  )

  /** Keyboard / tap activation: flip the committed resting point. The live
   * offset is presentation state (mid-spring it lags), so the button's
   * contract is "opposite of where we last committed". */
  const toggle = useCallback(() => {
    const target = expanded ? drag.maxOffset : 0
    setExpanded(target === 0)
    springTo(target, 0)
  }, [drag, springTo, expanded])

  // Shared grab: interrupts any spring and starts 1:1 tracking. `capture`
  // retargets the pointer stream to that element — right for the bare
  // handle at pointerdown, wrong above live buttons: an explicit capture
  // would carry the trailing click away from them. Chrome rows therefore
  // capture late, in the move handler, once travel proves a drag.
  const makePointerDown = useCallback(
    (capture: boolean) => (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      // A fresh grab interrupts any running spring from the live offset.
      cancelSpring()
      drag.pointerId = e.pointerId
      drag.startY = e.clientY
      drag.startOffset = drag.offset
      drag.moved = 0
      drag.captured = false
      drag.history = [{ t: performance.now(), y: e.clientY }]
      if (capture) {
        drag.captured = true
        takePointerCapture(e.currentTarget, e.pointerId)
      }
    },
    [cancelSpring, drag],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== drag.pointerId) return
      const now = performance.now()
      drag.history.push({ t: now, y: e.clientY })
      while (drag.history.length > 2 && now - drag.history[0].t > VELOCITY_WINDOW_MS) {
        drag.history.shift()
      }

      const dy = e.clientY - drag.startY
      drag.moved = Math.max(drag.moved, Math.abs(dy))

      // Capture late: chrome drags must not capture at pointerdown (that
      // would steal taps from the buttons inside), but only touch pointers
      // are implicitly captured — a mouse leaving the row mid-drag would
      // stop streaming moves and never deliver its release, stranding the
      // sheet between resting points. Past the tap threshold this is a
      // real drag, so take the stream over from there.
      if (!drag.captured && drag.moved >= TAP_THRESHOLD_PX) {
        drag.captured = true
        takePointerCapture(e.currentTarget, e.pointerId)
      }

      let next = drag.startOffset + dy
      if (next < 0) {
        next = -rubberbandDistance(-next, drag.maxOffset || SHEET_MIN_CHROME_PX)
      } else if (next > drag.maxOffset) {
        next =
          drag.maxOffset +
          rubberbandDistance(next - drag.maxOffset, drag.maxOffset || SHEET_MIN_CHROME_PX)
      }
      drag.offset = next
      writePosition()
    },
    [drag, writePosition],
  )

  const releaseVelocity = useCallback(() => {
    const first = drag.history[0]
    const last = drag.history[drag.history.length - 1]
    const dt = (last.t - first.t) / 1000
    if (first === last || dt < 0.016) return 0
    return (last.y - first.y) / dt
  }, [drag])

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== drag.pointerId) return
      drag.pointerId = -1
      drag.captured = false
      // Taps fall through to the button's click → toggle; only drags project.
      if (drag.moved < TAP_THRESHOLD_PX) return
      const velocity = releaseVelocity()
      const target = snapSheetTarget(drag.offset, velocity, drag.maxOffset)
      setExpanded(target === 0)
      springTo(target, velocity)
    },
    [drag, releaseVelocity, springTo],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== drag.pointerId) return
      drag.pointerId = -1
      drag.captured = false
      springTo(drag.offset > drag.maxOffset / 2 ? drag.maxOffset : 0, 0)
    },
    [drag, springTo],
  )

  // A drag on the handle still dispatches click on release; swallow it so it
  // doesn't toggle on top of the projected spring.
  const onClickCapture = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (drag.moved >= TAP_THRESHOLD_PX) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [drag],
  )

  return {
    expanded,
    toggle,
    handleProps: {
      onPointerDown: makePointerDown(true),
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClick: toggle,
      onClickCapture,
    },
    // For chrome around live controls: taps reach the buttons untouched,
    // a dragged gesture grabs the sheet, and its trailing click is
    // swallowed by the shared click capture.
    dragProps: {
      onPointerDown: makePointerDown(false),
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
    },
  }
}
