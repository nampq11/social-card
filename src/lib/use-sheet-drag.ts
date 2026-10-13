import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  SHEET_PEEK_PX,
  rubberbandDistance,
  sheetExpandedPx,
  snapSheetTarget,
  springStep,
} from './sheet-drag';

// Below this travel a pointer sequence is a tap, not a drag (gesture hysteresis).
const TAP_THRESHOLD_PX = 10;

/** jsdom implements no pointer capture; in browsers a dead pointer id is
 * rejected (InvalidPointerId) — both must degrade to an uncaptured drag. */
function takePointerCapture(el: HTMLElement, pointerId: number) {
  if (typeof el.setPointerCapture !== 'function') return;
  try {
    el.setPointerCapture(pointerId);
  } catch {
    // The pointer is already gone; the release handlers will no-op.
  }
}
// Velocity is measured over a short trailing window of pointer positions.
const VELOCITY_WINDOW_MS = 100;

interface DragState {
  /** Pull-down offset: 0 = expanded, maxOffset = peeked. */
  offset: number;
  maxOffset: number;
  expandedPx: number;
  navHeight: number;
  velocity: number;
  animating: boolean;
  pointerId: number;
  startY: number;
  startOffset: number;
  moved: number;
  /** True once this gesture owns the pointer stream (explicit capture). */
  captured: boolean;
  history: { t: number; y: number }[];
}

/**
 * Bottom-sheet gesture for the Mobile Shell: the sheet tracks the pointer
 * 1:1 (rubber-banded past its two resting points), and on release projects
 * the pointer velocity to pick a resting point, springing there with that
 * velocity carried over (Apple, "Designing Fluid Interfaces").
 *
 * The per-frame output is one transform written straight to the DOM — the
 * sheet and the tab pill carry it together, so the pill stays docked to the
 * sheet's live top edge instead of floating at the expanded position over
 * the card. React state is only the settled `expanded` flag the UI Copy
 * needs. The canvas reserve is static (nav + peek): the expanded sheet
 * overlays the card instead of shrinking it, so the headline the user is
 * editing stays at full size — only the card's lower third is covered.
 */
export function useSheetDrag(
  sheetRef: RefObject<HTMLElement | null>,
  navRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLElement | null>
) {
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<DragState>({
    offset: Number.POSITIVE_INFINITY,
    maxOffset: 0,
    expandedPx: 0,
    navHeight: 0,
    velocity: 0,
    animating: false,
    pointerId: -1,
    startY: 0,
    startOffset: 0,
    moved: 0,
    captured: false,
    history: [],
  }).current;
  const rafId = useRef<number | null>(null);

  const writePosition = useCallback(() => {
    const sheet = sheetRef.current;
    const transform = `translateY(${drag.offset}px)`;
    if (sheet) sheet.style.transform = transform;
    const nav = navRef.current;
    if (nav) nav.style.transform = transform;
  }, [drag, navRef, sheetRef]);

  const cancelSpring = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    drag.animating = false;
  }, [drag]);

  /** Measures the two resting points from the live viewport, then re-clamps. */
  const measure = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    drag.expandedPx = sheetExpandedPx(window.innerHeight);
    drag.navHeight = navRef.current?.offsetHeight ?? 0;
    drag.maxOffset = Math.max(0, drag.expandedPx - SHEET_PEEK_PX);
    sheet.style.height = `${drag.expandedPx}px`;
    drag.offset = Math.min(drag.offset, drag.maxOffset);
    if (drag.offset < 0) drag.offset = 0;
    // Static reserve (nav + peek — the safe-area padding lives inside the
    // section height) straight to the canvas element: an inherited CSS
    // variable would have to live on an ancestor and recalculates the whole
    // document.
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.paddingBottom = `${Math.round(
        drag.navHeight + SHEET_PEEK_PX
      )}px`;
    }
    writePosition();
  }, [canvasRef, drag, navRef, sheetRef, writePosition]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const onResize = () => {
      cancelSpring();
      measure();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cancelSpring, measure]);

  useEffect(() => cancelSpring, [cancelSpring]);

  // Breakpoint crossings unmount the sheet (mobile → desktop): give the
  // canvas its class padding back, or the inline reserve would stick.
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) canvas.style.paddingBottom = '';
    };
  }, [canvasRef]);

  const springTo = useCallback(
    (target: number, initialVelocity: number) => {
      cancelSpring();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        drag.offset = target;
        drag.velocity = 0;
        writePosition();
        return;
      }
      drag.animating = true;
      drag.velocity = initialVelocity;
      let last = performance.now();
      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.064);
        last = now;
        const step = springStep(drag.offset, drag.velocity, target, dt);
        drag.offset = step.position;
        drag.velocity = step.velocity;
        const settled =
          Math.abs(target - drag.offset) < 0.5 && Math.abs(drag.velocity) < 20;
        if (settled) {
          drag.offset = target;
          drag.velocity = 0;
          drag.animating = false;
          rafId.current = null;
          writePosition();
          return;
        }
        writePosition();
        rafId.current = requestAnimationFrame(frame);
      };
      rafId.current = requestAnimationFrame(frame);
    },
    [cancelSpring, drag, writePosition]
  );

  /** Keyboard / tap activation: flip the committed resting point. The live
   * offset is presentation state (mid-spring it lags), so the button's
   * contract is "opposite of where we last committed". */
  const toggle = useCallback(() => {
    const target = expanded ? drag.maxOffset : 0;
    setExpanded(target === 0);
    springTo(target, 0);
  }, [drag, springTo, expanded]);

  // Shared grab: interrupts any spring and starts 1:1 tracking. `capture`
  // retargets the pointer stream to that element — right for the bare
  // handle at pointerdown, wrong above live buttons: an explicit capture
  // would carry the trailing click away from them. Chrome rows therefore
  // capture late, in the move handler, once travel proves a drag.
  const makePointerDown = useCallback(
    (capture: boolean) => (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // A fresh grab interrupts any running spring from the live offset.
      cancelSpring();
      drag.pointerId = e.pointerId;
      drag.startY = e.clientY;
      drag.startOffset = drag.offset;
      drag.moved = 0;
      drag.captured = false;
      drag.history = [{ t: performance.now(), y: e.clientY }];
      if (capture) {
        drag.captured = true;
        takePointerCapture(e.currentTarget, e.pointerId);
      }
    },
    [cancelSpring, drag]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== drag.pointerId) return;
      const now = performance.now();
      drag.history.push({ t: now, y: e.clientY });
      while (drag.history.length > 2 && now - drag.history[0].t > VELOCITY_WINDOW_MS) {
        drag.history.shift();
      }

      const dy = e.clientY - drag.startY;
      drag.moved = Math.max(drag.moved, Math.abs(dy));

      // Capture late: chrome drags must not capture at pointerdown (that
      // would steal taps from the buttons inside), but only touch pointers
      // are implicitly captured — a mouse leaving the row mid-drag would
      // stop streaming moves and never deliver its release, stranding the
      // sheet between resting points. Past the tap threshold this is a
      // real drag, so take the stream over from there.
      if (!drag.captured && drag.moved >= TAP_THRESHOLD_PX) {
        drag.captured = true;
        takePointerCapture(e.currentTarget, e.pointerId);
      }

      let next = drag.startOffset + dy;
      if (next < 0) {
        next = -rubberbandDistance(-next, drag.maxOffset || SHEET_PEEK_PX);
      } else if (next > drag.maxOffset) {
        next =
          drag.maxOffset +
          rubberbandDistance(next - drag.maxOffset, drag.maxOffset || SHEET_PEEK_PX);
      }
      drag.offset = next;
      writePosition();
    },
    [drag, writePosition]
  );

  const releaseVelocity = useCallback(() => {
    const first = drag.history[0];
    const last = drag.history[drag.history.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (first === last || dt < 0.016) return 0;
    return (last.y - first.y) / dt;
  }, [drag]);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== drag.pointerId) return;
      drag.pointerId = -1;
      // Taps fall through to the button's click → toggle; only drags project.
      if (drag.moved < TAP_THRESHOLD_PX) return;
      const velocity = releaseVelocity();
      const target = snapSheetTarget(drag.offset, velocity, drag.maxOffset);
      setExpanded(target === 0);
      springTo(target, velocity);
    },
    [drag, releaseVelocity, springTo]
  );

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== drag.pointerId) return;
      drag.pointerId = -1;
      springTo(drag.offset > drag.maxOffset / 2 ? drag.maxOffset : 0, 0);
    },
    [drag, springTo]
  );

  // A drag on the handle still dispatches click on release; swallow it so it
  // doesn't toggle on top of the projected spring.
  const onClickCapture = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (drag.moved >= TAP_THRESHOLD_PX) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [drag]
  );

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
  };
}
