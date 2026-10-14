import { useCallback, useEffect, useState, type RefObject } from 'react'

// Fit-to-View never upscales past the card's natural size — the canvas is a
// precision preview, so "fit" means "fill without cropping or enlarging".
// Manual zoom keeps the bounds the zoom buttons always had.
export const MAX_FIT_SCALE = 1
export const MIN_ZOOM_SCALE = 0.4
export const MAX_ZOOM_SCALE = 1.2
export const ZOOM_STEP = 0.1

/** Pure Fit-to-View math: 0 signals "container has no measurable size yet". */
export function computeFitScale(
  containerWidth: number,
  containerHeight: number,
  cardWidth: number,
  cardHeight: number,
): number {
  if (containerWidth <= 0 || containerHeight <= 0 || cardWidth <= 0 || cardHeight <= 0) {
    return 0
  }
  return Math.min(containerWidth / cardWidth, containerHeight / cardHeight, MAX_FIT_SCALE)
}

export type ZoomMode = 'fit' | 'manual'

/**
 * Fit-to-View scale for the Card Preview (GLOSSARY.md): the default mode
 * re-fits on every container resize (rotation, window drag); a manual zoom
 * sticks until Fit is selected again. Card dimensions come straight from
 * RATIO_INFO, so nothing about the card itself needs measuring.
 */
export function useFitScale(
  containerRef: RefObject<HTMLDivElement | null>,
  cardWidth: number,
  cardHeight: number,
) {
  const [mode, setMode] = useState<ZoomMode>('fit')
  const [scale, setScale] = useState(1)

  const refit = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    // Fit the content box, not the border box: the mobile canvas reserves
    // bottom padding for the Mobile Sheet, and that reserve must shrink the
    // fit area or the centered card spills behind the sheet (landscape
    // phones fit by height, so the spill was worst there).
    const { paddingLeft, paddingRight, paddingTop, paddingBottom } = getComputedStyle(el)
    const availableWidth = el.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight)
    const availableHeight = el.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom)
    const next = computeFitScale(availableWidth, availableHeight, cardWidth, cardHeight)
    if (next > 0) setScale(next)
  }, [containerRef, cardWidth, cardHeight])

  useEffect(() => {
    if (mode !== 'fit') return
    const el = containerRef.current
    if (!el) return
    refit()
    // jsdom has no ResizeObserver: tests keep the initial computation only.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => refit())
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, refit, containerRef])

  const zoomIn = useCallback(() => {
    setMode('manual')
    setScale((s) => Math.min(MAX_ZOOM_SCALE, Number((s + ZOOM_STEP).toFixed(4))))
  }, [])

  const zoomOut = useCallback(() => {
    setMode('manual')
    setScale((s) => Math.max(MIN_ZOOM_SCALE, Number((s - ZOOM_STEP).toFixed(4))))
  }, [])

  // setMode alone re-runs the refit effect; the explicit call covers the
  // already-in-fit case (e.g. after a ratio swap) where mode never changes.
  const fit = useCallback(() => {
    setMode('fit')
    refit()
  }, [refit])

  return { scale, mode, zoomIn, zoomOut, fit }
}
