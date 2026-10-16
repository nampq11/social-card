// The deploy keeps a single HTML at /social-card (vercel.json's catch-all
// rewrites every /social-card/* path onto it), so the landing page and the
// studio split client-side instead of by server routes: the landing is the
// shared front door and the studio lives one segment deeper. Two paths need
// a branch, not a router.
export type ViewName = 'landing' | 'studio'

/** The studio renders only at its own path; everything else — the bare app
 *  path, its trailing-slash twin, stray paths the catch-all served — falls
 *  through to the landing. */
export function resolveView(pathname: string): ViewName {
  return /^\/social-card\/studio\/?$/.test(pathname) ? 'studio' : 'landing'
}
