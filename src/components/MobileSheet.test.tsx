// @vitest-environment jsdom
import { createRef, useRef } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileSheet } from './MobileSheet'
import { useCardStore } from '../lib/card-store'
import { DEFAULT_CARD_STATE } from '../constants/presets'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'
import type { CardState } from '../types'

setupCardStudioTest()

// The studio's factory card ships as a Showcase; the sheet's Quote-mode
// contracts render from a Quote baseline (same seeding as the Inspector
// suite).
beforeEach(() => {
  const quoteCard: CardState = {
    ...DEFAULT_CARD_STATE,
    cardType: 'quote',
    showcase: { shots: [], annotations: [] },
  }
  useCardStore.setState({ card: quoteCard })
})

const renderSheet = () => renderWithUiCopy(<MobileSheet canvasRef={createRef()} />)

describe('MobileSheet', () => {
  it('opens on the Content tab: presets and headline, no style controls', () => {
    renderSheet()

    expect(screen.getByText(/Mẫu nhanh/)).not.toBeNull()
    expect(screen.getByLabelText(/Tiêu đề chính/)).not.toBeNull()
    expect(screen.queryByLabelText(/Tỉ lệ khung hình/)).toBeNull()
  })

  it('swaps the hosted Inspector group when a tab is activated', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('radio', { name: /Kiểu/ }))

    expect(screen.getByLabelText(/Tỉ lệ khung hình/)).not.toBeNull()
    expect(screen.getByRole('slider', { name: /Cỡ chữ tiêu đề/ })).not.toBeNull()
    expect(screen.queryByLabelText(/Tiêu đề chính/)).toBeNull()
  })

  it('hosts the Identity group: author fields and the QR toggle', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('radio', { name: /Định danh/ }))

    expect(screen.getByLabelText(/^Tên$/)).not.toBeNull()
    expect(screen.getByRole('switch', { name: /Hiển thị Mã QR/ })).not.toBeNull()
  })

  it('the drag handle expands and collapses the sheet as a button', () => {
    renderSheet()

    const handle = screen.getByRole('button', { name: /Mở hoặc thu gọn bảng tùy chỉnh/ })
    expect(handle.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(handle)
    expect(handle.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(handle)
    expect(handle.getAttribute('aria-expanded')).toBe('false')
  })

  it('Reset in the sheet header restores the default Card State', () => {
    renderSheet()

    fireEvent.change(screen.getByLabelText(/Tiêu đề chính/), {
      target: { value: 'Sửa thử trên mobile' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Mặc định/ }))

    expect(useCardStore.getState().card.headline).toBe(DEFAULT_CARD_STATE.headline)
  })

  it('a drag from the sheet header captures the pointer only past the tap threshold', () => {
    // jsdom implements no pointer capture; the contract under test is that
    // the hook takes the stream over — without it, a mouse leaving the row
    // mid-drag strands the sheet between resting points (regression, #18).
    renderSheet()
    const row = document.querySelector('section .flex.items-center.justify-between') as HTMLElement
    const capture = vi.fn()
    row.setPointerCapture = capture

    fireEvent.pointerDown(row, { pointerId: 1, clientY: 500 })
    fireEvent.pointerMove(row, { pointerId: 1, clientY: 496 })
    expect(capture).not.toHaveBeenCalled()

    fireEvent.pointerMove(row, { pointerId: 1, clientY: 460 })
    expect(capture).toHaveBeenCalledWith(1)
  })
})

describe('MobileSheet tab pill docking', () => {
  it('the nav rides the same transform as the sheet, docking to its live top edge', () => {
    renderSheet()

    const nav = screen.getByRole('navigation', { name: /Tùy chỉnh Card/ })
    const section = document.querySelector('section') as HTMLElement

    // The nav is inside the sheet plane (iOS HIG: grabber → header → tabs → content),
    // riding the sheet's transform down to peek so it hugs below the canvas.
    expect(section.contains(nav)).toBe(true)
    // jsdom reports no layout, so the content top falls back to the chrome floor.
    // Peek offset is hand-derived from the 58dvh spec (ADR 0002), not from the
    // implementation's own helpers: a 768px viewport expands to round(768 × 0.58)
    // = 445px, so the sheet peeks at 445 − 96px chrome floor = 349px.
    // translate3d form: keeps the sheet on its own composited layer (iOS 18
    // stale-tile ghosting, #53).
    expect(section.style.transform).toBe('translate3d(0, 349px, 0)')
  })

  it('re-derives the resting peek offset on window resize even after user interactions', () => {
    renderSheet()
    const handle = screen.getByRole('button', { name: /Mở hoặc thu gọn bảng tùy chỉnh/ })
    const section = document.querySelector('section') as HTMLElement

    // User toggles open then toggles closed back to peek
    fireEvent.click(handle)
    expect(handle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(handle)
    expect(handle.getAttribute('aria-expanded')).toBe('false')

    // Viewport height changes (e.g. mobile orientation rotation or dynamic toolbars)
    window.innerHeight = 900
    fireEvent(window, new Event('resize'))

    // Hand-derived again: 900px viewport → round(900 × 0.58) = 522 − 96 = 426.
    expect(section.style.transform).toBe('translate3d(0, 426px, 0)')
  })

  it('the sheet header names the sheet, not the active tab (no duplicated label)', () => {
    renderSheet()

    // The tab bar sits right below the header; repeating the tab name there
    // burns vertical space and reads as a doubled label (mobile-review #2).
    const header = document.querySelector(
      'section .flex.items-center.justify-between',
    ) as HTMLElement
    expect(header.textContent).toContain('Tùy chỉnh Card')
    expect(header.textContent).not.toContain('Nội dung')
  })
})

describe('MobileSheet Showcase mode', () => {
  it('inherits the registry swap: Screenshots replace Presets and Headline', () => {
    renderSheet()

    fireEvent.click(screen.getByRole('radio', { name: 'Giới thiệu' }))

    expect(screen.getByText('Ảnh chụp màn hình')).not.toBeNull()
    expect(screen.queryByText('Mẫu nhanh')).toBeNull()
    expect(screen.queryByLabelText('Tiêu đề chính')).toBeNull()
  })
})

describe('MobileSheet rest-time canvas reserve (issues #47/#53)', () => {
  // A real host element: the contract under test is the canvas padding the
  // hook writes at resting points (ADR 0002 addendum, rest-time since #53) —
  // the detached ref used by the other suites skips that write entirely.
  function SheetWithCanvas() {
    const canvasRef = useRef<HTMLDivElement>(null)
    return (
      <>
        <div ref={canvasRef} data-testid="canvas" />
        <MobileSheet canvasRef={canvasRef} />
      </>
    )
  }

  it('rewrites the reserve only at rest — drags stay transform-only', () => {
    // Earlier suites in this file leave innerHeight at 900; pin the viewport
    // this suite's hand-derived numbers assume.
    window.innerHeight = 768
    renderWithUiCopy(<SheetWithCanvas />)
    const canvas = screen.getByTestId('canvas')
    const handle = screen.getByRole('button', { name: /Mở hoặc thu gọn bảng tùy chỉnh/ })
    const section = document.querySelector('section') as HTMLElement

    // Hand-derived from the 58dvh spec (ADR 0002) at the 768px jsdom
    // viewport, not from the hook's own helpers: expanded = round(768 × 0.58)
    // = 445, peek offset = 445 − 96px chrome floor = 349, so the resting
    // reserve equals the peek chrome height plus the canvas's 16px breathing
    // room — the card's fit area ends that far above the sheet's top edge,
    // nothing clipped.
    expect(canvas.style.paddingBottom).toBe('112px')

    // Mid-drag NOT A SINGLE layout write happens (they starved iOS 18
    // WebKit's commit pipeline and the screen replayed stale frames, #53):
    // 100px of travel up moves only the transform — 349 − 100 = 249.
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 400 })
    expect(section.style.transform).toBe('translate3d(0, 249px, 0)')
    expect(canvas.style.paddingBottom).toBe('112px')

    // Rubber-banding past expanded also stays transform-only.
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 0 })
    expect(canvas.style.paddingBottom).toBe('112px')

    // Release commits expanded: the reserve lands from the projected
    // destination at release itself — concurrent with the spring, so the
    // card refit and the sheet arrive together (the full 445px coverage
    // plus the 16px gap).
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 0 })
    expect(canvas.style.paddingBottom).toBe('461px')
  })

  it('commits the reserve from the projected destination at release — mid-flight offsets never leak in', () => {
    window.innerHeight = 768
    renderWithUiCopy(<SheetWithCanvas />)
    const canvas = screen.getByTestId('canvas')
    const handle = screen.getByRole('button', { name: /Mở hoặc thu gọn bảng tùy chỉnh/ })

    // From peek (offset 349), drag up past the midpoint to offset 99 and
    // release with no velocity: the projection commits expanded
    // (destination 0) while the sheet is still mid-flight. The reserve
    // must read the DESTINATION (445 + 16 = 461px), and the setExpanded
    // re-render's measure pass — which runs synchronously right after
    // release — must not overwrite it with the transient offset
    // (445 − 99 + 16 = 362px).
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 })
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 250 })
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 250 })
    expect(canvas.style.paddingBottom).toBe('461px')
  })
})
