// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

    const bug = screen.getByRole('radio', { name: t.feedback_kind_bug }) as HTMLInputElement
    expect(bug.checked).toBe(true)

    const send = screen.getByRole('button', { name: t.feedback_submit }) as HTMLButtonElement
    expect(send.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Xuất 16:9 bị lỗi' },
    })
    expect(send.disabled).toBe(false)
  })

  it('sends the typed feedback as a prefilled GitHub issue in a new tab', () => {
    renderWithUiCopy(<FeedbackPage />)
    const t = landingDictionaries.vi
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    fireEvent.click(screen.getByText(t.feedback_kind_idea))
    fireEvent.change(screen.getByLabelText(t.feedback_message_label), {
      target: { value: 'Thêm theme tối hơn nữa' },
    })
    fireEvent.change(screen.getByLabelText(t.feedback_email_label), {
      target: { value: 'me@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: t.feedback_submit }))

    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://github.com/nampq11/social-card/issues/new'),
      '_blank',
      'noopener',
    )
    const url = new URL(open.mock.calls[0]![0] as string)
    expect(url.searchParams.get('title')).toBe('[Idea] Thêm theme tối hơn nữa')
    expect(url.searchParams.get('body')).toContain('Thêm theme tối hơn nữa')
    expect(url.searchParams.get('body')).toContain('Reply-to: me@example.com')
  })

  it('never opens GitHub while the message is empty', () => {
    renderWithUiCopy(<FeedbackPage />)
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    fireEvent.click(screen.getByRole('button', { name: landingDictionaries.vi.feedback_submit }))

    expect(open).not.toHaveBeenCalled()
  })
})
