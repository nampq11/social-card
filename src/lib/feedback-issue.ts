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

// Screenshots ride to GitHub via the reporter's own clipboard: Send copies
// a PNG while the issue tab opens, and GitHub uploads pasted images under
// the reporter's session — no storage of ours involved. The cap guards
// decode cost, not an upload quota (GitHub takes up to 10 MB per image).
export const FEEDBACK_SCREENSHOT_MAX_BYTES = 3 * 1024 * 1024

export type ScreenshotValidation = 'ok' | 'too-large' | 'not-image'

export function validateScreenshot(file: { size: number; type: string }): ScreenshotValidation {
  if (!file.type.startsWith('image/')) return 'not-image'
  if (file.size > FEEDBACK_SCREENSHOT_MAX_BYTES) return 'too-large'
  return 'ok'
}

/** Decode any browser-supported image and re-encode it as PNG — the one
 *  clipboard image format every GitHub-pasting browser accepts. */
export async function screenshotToPngBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D unavailable')
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG encoding failed'))
    }, 'image/png')
  })
}
