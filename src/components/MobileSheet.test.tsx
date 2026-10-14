// @vitest-environment jsdom
import { createRef } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MobileSheet } from './MobileSheet'
import { SHEET_MIN_CHROME_PX, sheetExpandedPx } from '../lib/sheet-drag'
import { useCardStore } from '../lib/card-store'
import { DEFAULT_CARD_STATE } from '../constants/presets'
import { renderWithUiCopy, setupCardStudioTest } from '../test/card-studio'

setupCardStudioTest()

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
    expect(screen.getByRole('switch', { name: /Mã QR & Kêu gọi/ })).not.toBeNull()
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
    const peekOffset = sheetExpandedPx(window.innerHeight) - SHEET_MIN_CHROME_PX
    expect(section.style.transform).toBe(`translateY(${peekOffset}px)`)
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
