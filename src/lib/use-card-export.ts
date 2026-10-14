import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { copyCardToClipboard, downloadCardImage } from './export'
import { toFilename } from './card-text'
import { useCardStore } from './card-store'
import { useUiCopy } from './i18n'
import { useFlash } from './use-flash'
import { logDebug } from './log-debug'

// How long the Copy button keeps its "Copied!" state after a success.
const COPIED_FLASH_MS = 3500

/**
 * Card Export (GLOSSARY.md): rendering the current Card State to a
 * shareable image, to the clipboard or as a PNG file. This module owns the
 * whole flow — the exported card node (returned as a ref for the Card
 * Preview to attach), the re-entry guard, the promise-style feedback toasts
 * (Sonner owns queueing, timing and interruption; the UI Copy stays ours),
 * the Copied! button flash, and failure logging. Callers (Header buttons,
 * the Cmd+C shortcut) only see the four-member interface plus the ref.
 */
export function useCardExport() {
  const { copy: uiCopy } = useUiCopy()
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isCopied, copiedFlag] = useFlash<boolean>(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Shared flow for both export actions: guards re-entry, then runs the
  // action through one promise toast (processing → success/error).
  const runExport = (
    action: (card: HTMLDivElement) => Promise<unknown>,
    messages: { loading: string; success: string; error: string },
    onSuccess?: () => void,
  ) => {
    const card = cardRef.current
    if (!card || isExporting) return
    setIsExporting(true)
    const request = action(card)
    toast.promise(request, {
      loading: messages.loading,
      success: () => {
        onSuccess?.()
        return messages.success
      },
      error: messages.error,
    })
    // Sonner turns the rejection into the error toast; this catch keeps the
    // failure log and clears the re-entry guard on either outcome.
    request
      .catch((err) =>
        logDebug('useCardExport.runExport', `export failed during "${messages.loading}"`, err),
      )
      .finally(() => setIsExporting(false))
  }

  const copy = () =>
    runExport(
      (card) => copyCardToClipboard(card),
      {
        loading: uiCopy.copy_processing,
        success: uiCopy.copy_success,
        error: uiCopy.copy_error,
      },
      () => copiedFlag.flash(true, COPIED_FLASH_MS),
    )

  const download = () =>
    // The filename reads Card State at call time, so an edit made after the
    // last render still names the file correctly.
    runExport(
      (card) => downloadCardImage(card, toFilename(useCardStore.getState().card.headline)),
      {
        loading: uiCopy.download_processing,
        success: uiCopy.download_success,
        error: uiCopy.download_error,
      },
    )

  return { cardRef, isExporting, isCopied, copy, download }
}
