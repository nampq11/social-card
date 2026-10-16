import { describe, expect, it } from 'vitest'
import {
  FEEDBACK_SCREENSHOT_MAX_BYTES,
  buildFeedbackIssueUrl,
  validateScreenshot,
} from './feedback-issue'

// The URL query is the whole transport to GitHub, so the tests read the
// decoded params back out of the composed URL — the contract a reporter
// experiences when GitHub opens.
function issueParams(url: string): URLSearchParams {
  return new URL(url).searchParams
}

describe('buildFeedbackIssueUrl', () => {
  it('titles the issue with the kind and the message first line', () => {
    const url = buildFeedbackIssueUrl({ kind: 'bug', message: 'Export crashes\nsecond line' })

    expect(issueParams(url).get('title')).toBe('[Bug] Export crashes')
    expect(issueParams(url).get('body')).toContain('Export crashes\nsecond line')
  })

  it('appends the reply email and user agent to the body trailer', () => {
    const url = buildFeedbackIssueUrl({
      kind: 'idea',
      message: 'More themes please',
      email: 'a@b.vn',
      userAgent: 'TestUA/1.0',
    })
    const body = issueParams(url).get('body') ?? ''

    expect(body).toContain('Reply-to: a@b.vn')
    expect(body).toContain('User agent: TestUA/1.0')
  })

  it('omits the metadata the reporter did not provide', () => {
    const body = issueParams(buildFeedbackIssueUrl({ kind: 'feedback', message: 'Great app' })).get(
      'body',
    )

    expect(body).not.toContain('Reply-to:')
    expect(body).not.toContain('User agent:')
  })

  it('percent-encodes newlines and unicode so the URL stays a valid query', () => {
    const url = buildFeedbackIssueUrl({ kind: 'idea', message: 'Xuất ảnh\nnhanh hơn' })

    expect(url).not.toMatch(/\s/)
    expect(issueParams(url).get('body')).toContain('Xuất ảnh\nnhanh hơn')
  })

  it('truncates a long first line in the title but keeps the whole message in the body', () => {
    const longLine = 'x'.repeat(500)
    const params = issueParams(buildFeedbackIssueUrl({ kind: 'bug', message: longLine }))

    expect(params.get('title')!.length).toBeLessThan(80)
    expect(params.get('body')).toContain(longLine)
  })

  it('never splits an emoji when truncating the title', () => {
    // 59 chars + a 2-unit emoji straddles the truncation point: a UTF-16
    // slice would leave a lone surrogate that URI-encodes as malformed.
    const message = `${'x'.repeat(59)}🙂 and then some more text`
    const title = issueParams(buildFeedbackIssueUrl({ kind: 'idea', message })).get('title')!

    expect(title).toContain('🙂')
  })
})

describe('validateScreenshot', () => {
  it('accepts an image at or under the 3 MB cap', () => {
    expect(validateScreenshot({ type: 'image/png', size: FEEDBACK_SCREENSHOT_MAX_BYTES })).toBe(
      'ok',
    )
    expect(validateScreenshot({ type: 'image/jpeg', size: 1 })).toBe('ok')
  })

  it('rejects images past the cap', () => {
    expect(validateScreenshot({ type: 'image/png', size: FEEDBACK_SCREENSHOT_MAX_BYTES + 1 })).toBe(
      'too-large',
    )
  })

  it('rejects non-image files before even looking at the size', () => {
    expect(
      validateScreenshot({ type: 'application/pdf', size: FEEDBACK_SCREENSHOT_MAX_BYTES + 1 }),
    ).toBe('not-image')
  })
})
