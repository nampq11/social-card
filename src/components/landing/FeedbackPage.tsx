import { Paperclip, X } from 'lucide-react'
import { useState } from 'react'
import {
  FEEDBACK_MAX_LENGTH,
  GITHUB_ATTACHMENT_MAX_BYTES,
  buildFeedbackIssueUrl,
  screenshotToPngBlob,
  validateScreenshot,
  type FeedbackKind,
  type ScreenshotValidation,
} from '../../lib/feedback-issue'
import { logDebug } from '../../lib/log-debug'
import { LANDING_PATH } from '../../lib/view-route'
import { LandingNav } from './LandingNav'
import { useLandingCopy } from './landing-copy'

// Kind pills in pick order; the copy module owns their labels.
const KINDS: FeedbackKind[] = ['bug', 'feedback', 'idea']

// The keys resolve to plain strings only — `keyof LandingCopy` would also
// admit the structured lists (grid_items, faq_items) as "labels".
const KIND_LABEL_KEY: Record<
  FeedbackKind,
  'feedback_kind_bug' | 'feedback_kind_feedback' | 'feedback_kind_idea'
> = {
  bug: 'feedback_kind_bug',
  feedback: 'feedback_kind_feedback',
  idea: 'feedback_kind_idea',
}

// The third view: one quiet page whose only job is turning a message into
// a prefilled GitHub issue. The shape learns from tryonenotch's /feedback
// (nav, centered form, trust line, no footer); the destination is the
// public repo, so nothing here needs a server — even the screenshot only
// travels through the reporter's own clipboard into GitHub's uploader.
export function FeedbackPage() {
  const t = useLandingCopy()
  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotError, setScreenshotError] = useState<ScreenshotValidation | null>(null)
  // What Send wants the reporter to know once the issue tab is open —
  // only ever about the screenshot; the message itself needs no follow-up.
  const [sendNote, setSendNote] = useState<'copied' | 'copy-failed' | null>(null)
  const [isSending, setIsSending] = useState(false)

  // An empty message would file an empty issue — it is the one field that
  // must exist before Send lights up.
  const canSend = message.trim().length > 0

  const pickScreenshot = (file: File | undefined) => {
    setSendNote(null)
    if (!file) {
      setScreenshot(null)
      setScreenshotError(null)
      return
    }
    const verdict = validateScreenshot(file)
    setScreenshotError(verdict === 'ok' ? null : verdict)
    setScreenshot(verdict === 'ok' ? file : null)
  }

  const send = async () => {
    setIsSending(true)
    let copied = false
    if (screenshot) {
      // The clipboard write must land inside the click's transient
      // activation window, so convert-then-copy runs before the tab opens;
      // a failed copy only degrades the note — GitHub's own box takes
      // drag & drop.
      try {
        const png = await screenshotToPngBlob(screenshot)
        if (png.size > GITHUB_ATTACHMENT_MAX_BYTES) {
          throw new Error('re-encoded PNG exceeds the GitHub attachment cap')
        }
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
        copied = true
      } catch (error) {
        // Any hand-off failure only degrades the note — GitHub's own box
        // takes drag & drop — but leaves a trace for the support thread.
        logDebug('FeedbackPage.send', 'screenshot clipboard hand-off failed', error)
        copied = false
      }
    }
    const issueUrl = buildFeedbackIssueUrl({
      kind,
      message,
      email: email.trim() || undefined,
      userAgent: navigator.userAgent,
    })
    // 'noopener' as a feature forces a null return even on success, which
    // would make the blocked check below meaningless — sever the opener on
    // the live handle instead (settable cross-origin per spec).
    const issueTab = window.open(issueUrl, '_blank')
    if (issueTab) {
      issueTab.opener = null
    } else {
      // A popup blocker swallowed the tab — same destination, same tab.
      window.location.assign(issueUrl)
    }
    setSendNote(screenshot ? (copied ? 'copied' : 'copy-failed') : null)
    setIsSending(false)
  }

  return (
    <div className="min-h-dvh bg-canvas font-sans text-ink">
      {/* The very same header as the landing — the anchors just travel
          home first, since this page has no #sections of its own. */}
      <LandingNav homeHref={LANDING_PATH} sectionHrefBase={`${LANDING_PATH}/`} />
      <main className="mx-auto w-full max-w-xl px-6 pb-24 pt-16 md:pt-24">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent">{t.feedback_eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {t.feedback_title}
        </h1>
        <p className="mt-4 text-base text-ink-secondary md:text-lg">{t.feedback_lede}</p>

        <form
          className="mt-10"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSend && !isSending) void send()
          }}
        >
          <p id="feedback-kind-label" className="text-sm font-semibold text-ink">
            {t.feedback_kind_label}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="feedback-kind-label"
            className="mt-3 flex flex-wrap gap-2"
          >
            {KINDS.map((k) => (
              <label
                key={k}
                className={`inline-flex cursor-pointer items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/60 ${
                  kind === k
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-hairline bg-surface text-ink-secondary hover:text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="feedback-kind"
                  className="sr-only"
                  checked={kind === k}
                  onChange={() => setKind(k)}
                />
                {t[KIND_LABEL_KEY[k]]}
              </label>
            ))}
          </div>

          <div className="mt-6">
            <label htmlFor="feedback-message" className="text-sm font-semibold text-ink">
              {t.feedback_message_label}
            </label>
            <textarea
              id="feedback-message"
              value={message}
              maxLength={FEEDBACK_MAX_LENGTH}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t.feedback_message_placeholder}
              rows={6}
              className="mt-2 w-full resize-y rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            />
            <p className="mt-1.5 text-right text-xs text-ink-tertiary">
              {message.length}/{FEEDBACK_MAX_LENGTH}
            </p>
          </div>

          <div className="mt-6">
            <label htmlFor="feedback-email" className="text-sm font-semibold text-ink">
              {t.feedback_email_label}
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.feedback_email_placeholder}
              className="mt-2 w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-raised focus-within:ring-2 focus-within:ring-accent/60">
              <Paperclip className="size-3.5" aria-hidden />
              <span className="max-w-48 truncate">
                {screenshot ? screenshot.name : t.feedback_attach_label}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={t.feedback_attach_label}
                onChange={(event) => {
                  pickScreenshot(event.target.files?.[0])
                  // Clear the picker so re-choosing the same file fires
                  // change again — Chromium skips identical re-picks.
                  event.target.value = ''
                }}
              />
            </label>
            {!screenshot && (
              <span className="text-sm text-ink-tertiary">{t.feedback_attach_hint}</span>
            )}
            {screenshot && (
              <button
                type="button"
                onClick={() => pickScreenshot(undefined)}
                aria-label={t.feedback_attach_remove}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-hairline text-ink-secondary transition-colors hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {screenshotError && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400" role="alert">
              {screenshotError === 'too-large'
                ? t.feedback_attach_too_large
                : t.feedback_attach_not_image}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSend || isSending}
            className="apple-button mt-8 inline-flex cursor-pointer items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-sm enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.feedback_submit}
          </button>

          <p className="mt-5 text-sm text-ink-tertiary">{t.feedback_trust}</p>
          {sendNote && (
            <p className="mt-2 text-sm text-ink-secondary" aria-live="polite">
              {sendNote === 'copied' ? t.feedback_attach_copied : t.feedback_attach_copy_failed}
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
