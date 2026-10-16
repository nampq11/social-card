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

// Each non-landing view matches its own path exactly (optionally with a
// trailing slash); everything else — the bare app path, its trailing-slash
// twin, stray paths the catch-all served — falls through to the landing.
const STUDIO_PATH_RE = new RegExp(`^${STUDIO_PATH}/?$`)
const FEEDBACK_PATH_RE = new RegExp(`^${FEEDBACK_PATH}/?$`)

/** Each view renders only at its own path. */
export function resolveView(pathname: string): ViewName {
  if (STUDIO_PATH_RE.test(pathname)) return 'studio'
  if (FEEDBACK_PATH_RE.test(pathname)) return 'feedback'
  return 'landing'
}
