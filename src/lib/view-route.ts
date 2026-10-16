// The deploy keeps a single HTML at /social-card (vercel.json's catch-all
// rewrites every /social-card/* path onto it), so the landing page, the
// feedback page and the studio split client-side instead of by server
// routes: the landing is the shared front door and the deeper pages live
// one segment down. A handful of paths need a branch, not a router.
export type ViewName = 'landing' | 'feedback' | 'studio'

/** The landing's path — where every other view links home to. */
export const LANDING_PATH = '/social-card'

/** The studio's path — the one route string the whole app links to. */
export const STUDIO_PATH = '/social-card/studio'

/** The feedback page's path. */
export const FEEDBACK_PATH = '/social-card/feedback'

// Every non-landing view with its own path, checked in order; the bare app
// path, its trailing-slash twin and stray paths the catch-all served fall
// through to the landing.
const VIEW_PATHS: Array<[Exclude<ViewName, 'landing'>, string]> = [
  ['studio', STUDIO_PATH],
  ['feedback', FEEDBACK_PATH],
]

/** Each view renders only at its own path. */
export function resolveView(pathname: string): ViewName {
  for (const [view, path] of VIEW_PATHS) {
    if (new RegExp(`^${path}/?$`).test(pathname)) return view
  }
  return 'landing'
}
