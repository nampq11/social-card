import { useEffect, useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { autoFitForSlot } from './shot-fit'
import type { Shot, ShotFit } from '../types'

// Decoded natural dimensions of a data URL, cached per URL — a Shot's pixels
// never change while its identity is stable, so one decode serves every
// render for the app's lifetime.
const naturalCache = new Map<string, { width: number; height: number }>()

const useNaturalDimensions = (dataUrl: string) => {
  const [natural, setNatural] = useState(naturalCache.get(dataUrl) ?? null)
  useEffect(() => {
    if (!dataUrl || naturalCache.has(dataUrl)) return
    let cancelled = false
    const probe = new Image()
    probe.onload = () => {
      if (cancelled) return
      const dims = { width: probe.naturalWidth, height: probe.naturalHeight }
      naturalCache.set(dataUrl, dims)
      setNatural(dims)
    }
    probe.src = dataUrl
    return () => {
      cancelled = true
    }
  }, [dataUrl])
  return natural
}

// The Shot's effective Fit (ADR 0006 §1): an explicit override wins; absent
// one, derived from the shot-to-slot ratio, with layout measured off the slot
// element and kept current by ResizeObserver. Before the first measurement or
// decode lands — and wherever measurement never happens (jsdom) — the hook
// answers cover, the historical render, so nothing flashes.
export function useEffectiveFit(
  shot: Shot | undefined,
  slotRef: RefObject<HTMLElement | null>,
): ShotFit {
  const natural = useNaturalDimensions(shot?.dataUrl ?? '')
  const [slot, setSlot] = useState<{ width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const el = slotRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setSlot({ width: rect.width, height: rect.height })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [slotRef])

  if (!shot) return 'cover'
  if (shot.fit) return shot.fit
  if (!natural || !slot) return 'cover'
  return autoFitForSlot(natural.width, natural.height, slot.width, slot.height)
}
