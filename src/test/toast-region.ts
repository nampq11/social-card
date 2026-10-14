import { expect } from 'vitest'
import { waitFor } from '@testing-library/react'

// Sonner renders toasts into this region; asserting within it verifies the
// message is a toast in the live region, not stray page text. Sonner defers
// every toast store update through a timer, so the region never appears
// synchronously after the action that fired the toast.
export const toastRegionNode = () => document.querySelector<HTMLElement>('[data-sonner-toaster]')

export const toastRegion = async () => {
  await waitFor(() => expect(toastRegionNode()).not.toBeNull())
  return toastRegionNode()!
}
