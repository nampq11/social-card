import { useEffect } from 'react'

export interface StudioShortcutsHandlers {
  onUndo: () => void
  onRedo: () => void
  onToggleInspector: () => void
  onCopy?: () => void
}

// Global studio keyboard shortcuts, matching design-tool conventions:
//   Cmd/Ctrl+Z        undo
//   Cmd/Ctrl+Shift+Z  redo (Ctrl+Y accepted too, the Windows convention)
//   Cmd/Ctrl+\        collapse/expand the Inspector (Figma's hide-panels key)
// Shortcuts are suppressed while a text field has focus — the field owns
// Cmd+Z for its own native text undo.
export function useStudioShortcuts({
  onUndo,
  onRedo,
  onToggleInspector,
  onCopy,
}: StudioShortcutsHandlers): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const target = event.target as HTMLElement | null
      const inTextField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true
      if (inTextField) return

      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) onRedo()
        else onUndo()
      } else if (key === 'y' && event.ctrlKey) {
        event.preventDefault()
        onRedo()
      } else if (key === '\\' || key === 'b') {
        event.preventDefault()
        onToggleInspector()
      } else if (key === 'c' && onCopy) {
        event.preventDefault()
        onCopy()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onUndo, onRedo, onToggleInspector, onCopy])
}
