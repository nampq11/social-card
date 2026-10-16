// The feedback page has no backend — a submission becomes a prefilled
// GitHub issue instead (the repo is public), so "Send" opens GitHub with
// everything the reporter typed already in place. The URL is the whole
// transport, which is why the builder stays a pure function: cheap to
// unit-test without a DOM, and honest about what is being sent where.

const ISSUES_NEW_URL = 'https://github.com/nampq11/social-card/issues/new'

export type FeedbackKind = 'bug' | 'feedback' | 'idea'

// GitHub drops over-long query strings, and percent-encoding expands
// Vietnamese/CJK text up to ~9×, so the form caps the message well below
// the backend-POST sizes a form service could afford.
export const FEEDBACK_MAX_LENGTH = 1000

// The issue list stays scannable when titles hold one short line.
const TITLE_MAX_LINE = 60

const KIND_LABEL: Record<FeedbackKind, string> = {
  bug: 'Bug',
  feedback: 'Feedback',
  idea: 'Idea',
}

export function buildFeedbackIssueUrl(input: {
  kind: FeedbackKind
  message: string
  email?: string
  userAgent?: string
}): string {
  const firstLine = input.message.split('\n', 1)[0].trim()
  const titleFirstLine =
    firstLine.length > TITLE_MAX_LINE ? `${firstLine.slice(0, TITLE_MAX_LINE)}…` : firstLine
  const title = `[${KIND_LABEL[input.kind]}] ${titleFirstLine}`

  // The trailer groups the metadata the reporter did not type (and keeps
  // it visible in the issue, so nothing is attached behind their back).
  const trailer = [
    input.email ? `Reply-to: ${input.email}` : null,
    input.userAgent ? `User agent: ${input.userAgent}` : null,
    'Sent from the Social Card feedback page',
  ].filter((line) => line !== null)

  const body = [input.message.trim(), '---', ...trailer].join('\n')

  return `${ISSUES_NEW_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
}
