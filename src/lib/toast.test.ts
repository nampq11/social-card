import { beforeEach, describe, expect, it, vi } from 'vitest'

const logDebugMock = vi.fn()
const sonnerSuccessMock = vi.fn()
let failSonnerChunk = false

// Each test registers fresh module mocks and resets the registry so the
// cached load promise (and mock state) from a previous test never leaks in.
beforeEach(() => {
  vi.resetModules()
  logDebugMock.mockClear()
  sonnerSuccessMock.mockClear()
  failSonnerChunk = false
  vi.doMock('./log-debug', () => ({ logDebug: logDebugMock }))
  vi.doMock('sonner', () => {
    if (failSonnerChunk) throw new Error('ChunkLoadError')
    return { toast: { success: sonnerSuccessMock } }
  })
})

describe('toast proxy', () => {
  it('forwards method calls to sonner once the chunk loads', async () => {
    const { toast } = await import('./toast')

    await toast.success('copied!')

    expect(sonnerSuccessMock).toHaveBeenCalledWith('copied!')
    expect(logDebugMock).not.toHaveBeenCalled()
  })

  it('drops the toast with a log instead of an unhandled rejection when the chunk fails to load', async () => {
    failSonnerChunk = true
    const { toast } = await import('./toast')

    // Call sites fire toasts without awaiting; a rejecting return value
    // here would surface as an unhandled rejection.
    await expect(toast.success('never shown')).resolves.toBeUndefined()
    expect(logDebugMock).toHaveBeenCalledTimes(1)
    expect(logDebugMock.mock.calls[0][2]).toBeInstanceOf(Error)
    expect(sonnerSuccessMock).not.toHaveBeenCalled()
  })

  it('does not cache the failed load: the next toast retries the chunk', async () => {
    failSonnerChunk = true
    const { toast } = await import('./toast')
    await toast.success('dropped by the failed chunk')

    failSonnerChunk = false
    await toast.success('recovered')

    expect(sonnerSuccessMock).toHaveBeenCalledWith('recovered')
  })
})
