// @vitest-environment jsdom
import { act, waitFor, within } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Toaster } from 'sonner'
import type { ReactNode } from 'react'
import { useCardExport } from './use-card-export'
import { copyCardToClipboard, downloadCardImage } from './export'
import { useCardStore } from './card-store'
import { dictionaries, UI_LANGUAGE_STORAGE_KEY } from './i18n'
import { UiCopyProvider } from './i18n'
import { setupCardStudioTest } from '../test/card-studio'
import { toastRegion } from '../test/toast-region'

// html-to-image cannot run in a jsdom DOM — the export actions module stays
// the single mock boundary (same as App.test.tsx).
vi.mock('./export', () => ({
  copyCardToClipboard: vi.fn(async () => true),
  downloadCardImage: vi.fn(async () => undefined),
}))

setupCardStudioTest()

// Holds one export in its processing state until the test settles it — the
// promise toast's processing phase is only observable while unresolved.
const deferredExport = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// The exported card node, standing in for the Card Preview that attaches the
// ref in the real app. The module's own Toaster sits beside the hook so its
// toast assertions have a live region (App mounts the region in production).
const cardNode = document.createElement('div')

const renderExporter = () => {
  const { result } = renderHook(() => useCardExport(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <UiCopyProvider>
        <Toaster />
        {children}
      </UiCopyProvider>
    ),
  })
  act(() => {
    result.current.cardRef.current = cardNode
  })
  return { result }
}

describe('useCardExport', () => {
  it('copy flows through one promise toast: processing → success', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise)
    const { result } = renderExporter()

    act(() => result.current.copy())

    const region = await toastRegion()
    expect(within(region).getByText(dictionaries.vi.copy_processing)).toBeTruthy()

    deferred.resolve(true)
    expect(await within(region).findByText(dictionaries.vi.copy_success)).toBeTruthy()
  })

  it('copy success raises the Copied! flag — the flash lives on the button, not in a toast', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise)
    const { result } = renderExporter()

    act(() => result.current.copy())
    expect(result.current.isCopied).toBe(false)

    deferred.resolve(true)
    await within(await toastRegion()).findByText(dictionaries.vi.copy_success)
    await waitFor(() => expect(result.current.isCopied).toBe(true))
  })

  it('copy failure surfaces as an error toast, clears the guard, and never flashes Copied!', async () => {
    vi.mocked(copyCardToClipboard).mockRejectedValueOnce(new Error('clipboard unavailable'))
    const { result } = renderExporter()

    act(() => result.current.copy())

    expect(await within(await toastRegion()).findByText(dictionaries.vi.copy_error)).toBeTruthy()
    await waitFor(() => {
      expect(result.current.isExporting).toBe(false)
      expect(result.current.isCopied).toBe(false)
    })
  })

  it('download derives the filename from the Card State headline at call time', async () => {
    const deferred = deferredExport<void>()
    vi.mocked(downloadCardImage).mockReturnValueOnce(deferred.promise)
    const { result } = renderExporter()

    act(() => {
      useCardStore.getState().patchCard({ headline: 'Ship AI Notebook' })
    })
    act(() => result.current.download())

    const region = await toastRegion()
    expect(within(region).getByText(dictionaries.vi.download_processing)).toBeTruthy()

    deferred.resolve()
    expect(await within(region).findByText(dictionaries.vi.download_success)).toBeTruthy()
    expect(downloadCardImage).toHaveBeenCalledWith(cardNode, 'ship-ai-notebook.png')
  })

  it('guards re-entry: a second copy while one runs is ignored', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValue(deferred.promise)
    const { result } = renderExporter()

    act(() => result.current.copy())
    act(() => result.current.copy())

    expect(copyCardToClipboard).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current.isExporting).toBe(true))

    deferred.resolve(true)
    await waitFor(() => expect(result.current.isExporting).toBe(false))
  })

  it('does nothing while the card node is missing', () => {
    const { result } = renderExporter()
    act(() => {
      result.current.cardRef.current = null
      result.current.copy()
      result.current.download()
    })

    expect(copyCardToClipboard).not.toHaveBeenCalled()
    expect(downloadCardImage).not.toHaveBeenCalled()
  })

  it('toasts follow the active Interface Language', async () => {
    const deferred = deferredExport<boolean>()
    vi.mocked(copyCardToClipboard).mockReturnValueOnce(deferred.promise)
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, 'en')
    const { result } = renderExporter()

    act(() => result.current.copy())

    const region = await toastRegion()
    expect(within(region).getByText(dictionaries.en.copy_processing)).toBeTruthy()

    deferred.resolve(true)
    expect(await within(region).findByText(dictionaries.en.copy_success)).toBeTruthy()
  })
})
