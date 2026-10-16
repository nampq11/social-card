import { useState } from 'react'
import {
  FEEDBACK_MAX_LENGTH,
  buildFeedbackIssueUrl,
  type FeedbackKind,
} from '../../lib/feedback-issue'
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
// public repo, so nothing here needs a server.
export function FeedbackPage() {
  const t = useLandingCopy()
  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  // An empty message would file an empty issue — it is the one field that
  // must exist before Send lights up.
  const canSend = message.trim().length > 0

  const send = () => {
    window.open(
      buildFeedbackIssueUrl({
        kind,
        message,
        email: email.trim() || undefined,
        userAgent: navigator.userAgent,
      }),
      '_blank',
      'noopener',
    )
  }

  return (
    <div className="min-h-dvh bg-canvas font-sans text-ink">
      <LandingNav homeHref={LANDING_PATH} showSections={false} />
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
            if (canSend) send()
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

          <button
            type="submit"
            disabled={!canSend}
            className="apple-button mt-8 inline-flex cursor-pointer items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-sm enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.feedback_submit}
          </button>

          <p className="mt-5 text-sm text-ink-tertiary">{t.feedback_trust}</p>
        </form>
      </main>
    </div>
  )
}
