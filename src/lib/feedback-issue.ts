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

// Issue titles are read by maintainers, so the kind is always spelled in
// English regardless of the reporter's Interface Language.
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
  // Truncate by code points, not UTF-16 units: slicing through an emoji
  // leaves a lone surrogate that makes encodeURIComponent throw.
  const chars = Array.from(firstLine)
  const titleFirstLine =
    chars.length > TITLE_MAX_LINE ? `${chars.slice(0, TITLE_MAX_LINE).join('')}…` : firstLine
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
// the reporter's session — no storage of ours involved. The pick cap only
// guards decode cost — the paste cap is what the re-encoded PNG must fit.
export const FEEDBACK_SCREENSHOT_MAX_BYTES = 3 * 1024 * 1024

// GitHub rejects issue attachments past this size — the encoder refuses to
// hand out a PNG that would fail the instructed paste with no in-app signal.
const GITHUB_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

// Long-side cap for the PNG re-encode: keeps the clipboard payload small
// (and the encode fast enough to stay inside the click's activation
// window) while staying legible at GitHub's ~880px issue column.
const SCREENSHOT_LONG_SIDE_MAX = 2000

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
  // Downscale oversized picks (a 3 MB photo decodes to ~12 MP, whose PNG
  // re-encode alone would blow GitHub's 10 MB paste cap) while leaving
  // ordinary screenshots untouched.
  const scale = Math.min(1, SCREENSHOT_LONG_SIDE_MAX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D unavailable')
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('PNG encoding failed'))
      else if (blob.size > GITHUB_ATTACHMENT_MAX_BYTES)
        reject(new Error('re-encoded PNG exceeds the GitHub attachment cap'))
      else resolve(blob)
    }, 'image/png')
  })
}
