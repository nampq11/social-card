import { useEffect, useRef, useState } from 'react'

/**
 * Diagnostic HUD for the iOS 18 Safari sheet bug (issue #49 follow-up).
 * Gated by ?sheetdebug in the URL — never ships active to users.
 *
 * The broken state recorded on-device (sheet pinned to the top of the
 * screen, header gone, dots below the sheet) is geometrically impossible
 * for this DOM while `position: fixed` on the sheet wrapper is honored
 * against the visible viewport. This HUD reads, live, every input that
 * geometry depends on — layout viewport (innerHeight), visual viewport,
 * document scroll range, the dvh-resolved root height, and the sheet's
 * actual rects — so one screenshot from the device discriminates which
 * input is lying.
 *
 * The HUD itself is position: fixed on purpose: if the iOS bug detaches
 * fixed elements from the visible viewport, this panel misplaces at the
 * same moment the sheet does — which is itself the confirmation.
 */

interface Snapshot {
  time: string
  iw: number
  ih: number
  vvW: number
  vvH: number
  vvTop: number
  vvScale: number
  docClientH: number
  docScrollH: number
  scrollY: number
  rootH: number
  wrapPos: string
  wrapTop: number
  wrapBottom: number
  sheetH: number
  sheetTop: number
  sheetInlineH: string
  sheetTransform: string
}

interface LogLine {
  time: string
  tag: string
}

const HUD_Z = 'fixed top-1 left-1 z-[9999] pointer-events-none'

function readSnapshot(): Snapshot {
  const sheet = document.querySelector<HTMLElement>('section[data-tour="inspector"]')
  const wrapper = sheet?.parentElement ?? null
  const root = document.querySelector<HTMLElement>('#root > div')
  const vv = window.visualViewport
  const s = sheet?.getBoundingClientRect()
  const w = wrapper?.getBoundingClientRect()
  return {
    time: new Date().toISOString().slice(11, 23),
    iw: window.innerWidth,
    ih: window.innerHeight,
    vvW: Math.round(vv?.width ?? -1),
    vvH: Math.round(vv?.height ?? -1),
    vvTop: Math.round(vv?.offsetTop ?? -1),
    vvScale: vv?.scale ?? -1,
    docClientH: document.documentElement.clientHeight,
    docScrollH: document.documentElement.scrollHeight,
    scrollY: Math.round(window.scrollY),
    rootH: root?.clientHeight ?? -1,
    wrapPos: wrapper ? getComputedStyle(wrapper).position : '?',
    wrapTop: w ? Math.round(w.top) : NaN,
    wrapBottom: w ? Math.round(w.bottom) : NaN,
    sheetH: s ? Math.round(s.height) : NaN,
    sheetTop: s ? Math.round(s.top) : NaN,
    sheetInlineH: sheet?.style.height || '(unset)',
    sheetTransform: sheet?.style.transform || '(unset)',
  }
}

export function SheetDebugHud() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [log, setLog] = useState<LogLine[]>([])
  const logRef = useRef<LogLine[]>([])

  useEffect(() => {
    const pushLog = (tag: string) => {
      const line = { time: new Date().toISOString().slice(11, 23), tag }
      logRef.current = [...logRef.current.slice(-7), line]
      setLog(logRef.current)
    }

    // Sampled on a rAF loop (throttled) so values stay live mid-drag;
    // the sheet's transform changes every animation frame.
    let raf = 0
    let last = 0
    const tick = (t: number) => {
      if (t - last > 150) {
        last = t
        setSnap(readSnapshot())
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const vv = window.visualViewport
    const onVvResize = () => pushLog('vv-resize')
    const onVvScroll = () => pushLog('vv-scroll')
    const onWinResize = () => pushLog('win-resize')
    const onOrient = () => pushLog('orient')
    vv?.addEventListener('resize', onVvResize)
    vv?.addEventListener('scroll', onVvScroll)
    window.addEventListener('resize', onWinResize)
    window.addEventListener('orientationchange', onOrient)
    return () => {
      cancelAnimationFrame(raf)
      vv?.removeEventListener('resize', onVvResize)
      vv?.removeEventListener('scroll', onVvScroll)
      window.removeEventListener('resize', onWinResize)
      window.removeEventListener('orientationchange', onOrient)
    }
  }, [])

  if (!snap) return null

  const row = (label: string, value: string | number, warn = false) => (
    <div className={warn ? 'text-red-400' : undefined}>
      {label}={value}
    </div>
  )

  return (
    <div className={`${HUD_Z} font-mono text-[9px] leading-[1.35] text-white`}>
      <div className="rounded bg-black/75 px-1.5 py-1">
        {row('ih', `${snap.ih}x${snap.iw}`)}
        {row(
          'vv',
          `${snap.vvH}x${snap.vvW} top${snap.vvTop} s${snap.vvScale}`,
          snap.vvH !== snap.ih,
        )}
        {row('doc', `cl${snap.docClientH} sc${snap.docScrollH}`, snap.docScrollH > snap.docClientH)}
        {row('scrollY', snap.scrollY, snap.scrollY !== 0)}
        {row('rootH', snap.rootH, snap.rootH > snap.docClientH)}
        {row('wrap', `${snap.wrapPos} t${snap.wrapTop} b${snap.wrapBottom}`)}
        {row('sheet', `t${snap.sheetTop} h${snap.sheetH}`)}
        <div className="text-white/70">
          {snap.sheetInlineH} {snap.sheetTransform}
        </div>
        <div className="mt-1 border-t border-white/25 pt-1 text-yellow-300">
          {log.map((l) => (
            <div key={l.time + l.tag}>
              {l.time.slice(0, 12)} {l.tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
