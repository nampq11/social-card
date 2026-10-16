// Sonner is deferred out of the entry chunk: toasts fire only on export and
// file-ingest actions, never during mount or render, so the module loads on
// first toast instead of blocking cold start. The proxy keeps call sites
// looking synchronous; sonner queues toasts until its Toaster mounts, so a
// toast fired before the region appears still displays once it does.
import { logDebug } from './log-debug'

type ToastApi = typeof import('sonner').toast

let loaded: Promise<ToastApi> | undefined

const load = () =>
  (loaded ??= import('sonner')
    .then((m) => m.toast)
    .catch((err: unknown) => {
      // Never cache the rejection: a stale tab whose chunk hashes were
      // purged by a redeploy gets a working toast again after a reload of
      // the chunk (transient network failure, service worker update, …).
      loaded = undefined
      throw err
    }))

export const toast = new Proxy({} as ToastApi, {
  get:
    (_, method: string) =>
    (...args: unknown[]) =>
      load().then(
        (api) => (api as unknown as Record<string, (...a: unknown[]) => unknown>)[method](...args),
        // The toast region is the very chunk that failed, so there is no UI
        // left to report through — log the dropped toast instead of leaving
        // an unhandled rejection with the caller getting silent feedback.
        (err) => logDebug('toast.load', 'toast dropped: sonner chunk failed to load', err),
      ),
})
