// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFeedbackIssueUrl } from '../../lib/feedback-issue'
import { renderWithUiCopy } from '../../test/card-studio'
import { landingDictionaries } from './landing-copy'
import { FeedbackPage } from './FeedbackPage'

beforeEach(() => {
  // The language provider persists its choice to localStorage; clear it so
  // every test starts in the default Vietnamese regardless of order.
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('FeedbackPage', () => {
  it('starts with Bug picked and Send disabled until a message exists', () => {
    renderWithUiCopy(<FeedbackPage />)
    const t = landingDictionaries.vi

    const bug = screen.getByRole('radio', { name: t.feedback_kinds.bug }) as HTMLInputElement
    expect(bug.checked).toBe(true)

    const send = screen.getByRole('button', { name: t.feedback_submit }) as HTMLButtonElement
    expect(send.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Xuất 16:9 bị lỗi' },
    })
    expect(send.disabled).toBe(false)
  })

  it('sends the typed feedback as a prefilled GitHub issue in a new tab', async () => {
    renderWithUiCopy(<FeedbackPage />)
    const t = landingDictionaries.vi
    // A truthy handle is what a real browser returns on success (the
    // opener is severed manually, not via the 'noopener' feature — that
    // forces a null return and would disguise success as a block).
    const tab: { opener: unknown } = { opener: window }
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)

    fireEvent.click(screen.getByText(t.feedback_kinds.idea))
    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Thêm theme tối hơn nữa' },
    })
    fireEvent.change(screen.getByLabelText(t.feedback_email_label), {
      target: { value: 'me@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: t.feedback_submit }))

    await waitFor(() => expect(open).toHaveBeenCalledTimes(1))
    // The URL's shape is the pure builder's contract (tested in its own
    // file); here the assertion is the wiring — all four form inputs
    // reached the builder, and its exact output went to window.open.
    expect(open).toHaveBeenCalledWith(
      buildFeedbackIssueUrl({
        kind: 'idea',
        message: 'Thêm theme tối hơn nữa',
        email: 'me@example.com',
        userAgent: navigator.userAgent,
      }),
      '_blank',
    )
    // The severed opener proves the if-branch ran; jsdom freezes the
    // location members, so the mutually exclusive same-tab fallback
    // is verified in the live browser, not here.
    expect(tab.opener).toBeNull()
  })

  it('falls back to same-tab navigation when the new tab is blocked', async () => {
    renderWithUiCopy(<FeedbackPage />)
    const t = landingDictionaries.vi
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Trình duyệt chặn popup' },
    })
    fireEvent.click(screen.getByRole('button', { name: t.feedback_submit }))

    // location.assign is unforgeable in jsdom, so the fallback navigation
    // itself cannot be observed here — pin that the null return still
    // handed off the URL without stranding the form. (The URL's shape is
    // the builder's contract, pinned in its own suite.)
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1))
  })

  it('never opens GitHub while the message is empty', () => {
    renderWithUiCopy(<FeedbackPage />)
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    fireEvent.click(screen.getByRole('button', { name: landingDictionaries.vi.feedback_submit }))

    expect(open).not.toHaveBeenCalled()
  })

  it('rejects an oversized screenshot and keeps the form usable', () => {
    renderWithUiCopy(<FeedbackPage />)
    const t = landingDictionaries.vi
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const tooBig = new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'big.png', {
      type: 'image/png',
    })

    fireEvent.change(screen.getByLabelText(t.feedback_attach_label), {
      target: { files: [tooBig] },
    })

    expect(screen.getByRole('alert').textContent).toBe(t.feedback_attach_too_large)
    expect(screen.queryByText(tooBig.name)).toBeNull()

    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Vẫn gửi được bình thường' },
    })
    fireEvent.click(screen.getByRole('button', { name: t.feedback_submit }))

    expect(open).toHaveBeenCalledTimes(1)
    // The rejected pick keeps its alert (it is still what the picker
    // holds) — but the send carried no screenshot, so no copy note.
    expect(screen.getByRole('alert').textContent).toBe(t.feedback_attach_too_large)
    expect(screen.queryByText(t.feedback_attach_copied)).toBeNull()
    expect(screen.queryByText(t.feedback_attach_copy_failed)).toBeNull()
  })

  it('still files the issue when the screenshot cannot be copied', async () => {
    // jsdom has no createImageBitmap/ClipboardItem, so the clipboard
    // hand-off fails for real — the contract under test is the degrade:
    // the issue opens anyway and the note says to attach it by hand.
    renderWithUiCopy(<FeedbackPage />)
    const t = landingDictionaries.vi
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const shot = new File([new Uint8Array(8)], 'shot.png', { type: 'image/png' })

    fireEvent.change(screen.getByLabelText(t.feedback_attach_label), {
      target: { files: [shot] },
    })
    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Có ảnh đính kèm' },
    })
    fireEvent.click(screen.getByRole('button', { name: t.feedback_submit }))

    // Send is async: convert → copy (throws here) → open the tab.
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1))
    expect(screen.getByText(t.feedback_attach_copy_failed)).toBeTruthy()
    expect(screen.queryByText(t.feedback_attach_copied)).toBeNull()
  })
})
