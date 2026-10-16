// Sonner is deferred out of the entry chunk: toasts fire only on export and
// file-ingest actions, never during mount or render, so the module loads on
// first toast instead of blocking cold start. The proxy keeps call sites
// looking synchronous; sonner queues toasts until its Toaster mounts, so a
// toast fired before the region appears still displays once it does.
type ToastApi = typeof import('sonner').toast

let loaded: Promise<ToastApi> | undefined

const load = () => (loaded ??= import('sonner').then((m) => m.toast))

export const toast = new Proxy({} as ToastApi, {
  get:
    (_, method: string) =>
    (...args: unknown[]) =>
      load().then((api) =>
        (api as unknown as Record<string, (...a: unknown[]) => unknown>)[method](...args),
      ),
})
