// Longest edge a stored Shot may have. Larger screenshots are scaled down on
// pick so exports stay fast and files stay shareable (spec #33, story 19).
export const SHOT_MAX_EDGE = 1600

// JPEG quality for the re-encode: high enough to hide recompression noise on
// screenshot text, small enough to keep stored shots and exports shareable.
export const SHOT_JPEG_QUALITY = 0.9

// What the canvas wrapper must produce for one Shot: the dimensions to draw
// plus the encode decision, decided once here so the wrapper stays thin.
export interface ScreenshotPolicy {
  width: number
  height: number
  mimeType: 'image/jpeg'
  quality: number
}

// Pure normalization policy for one uploaded image: given its natural
// dimensions, returns the dimensions to draw (long edge capped at maxEdge,
// aspect preserved) and the encode decision — always a JPEG re-encode,
// whatever the source format. No DOM, no canvas — the thin wrapper
// (ingestScreenshot) supplies those, which is why this is unit-tested while
// the wrapper is not (jsdom has no canvas).
export const screenshotIngestPolicy = (
  width: number,
  height: number,
  maxEdge: number = SHOT_MAX_EDGE,
): ScreenshotPolicy => {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    mimeType: 'image/jpeg',
    quality: SHOT_JPEG_QUALITY,
  }
}

// Thin canvas wrapper around screenshotIngestPolicy: loads the picked file,
// draws it at the policy's dimensions, and encodes with the policy's decision
// into the data URL stored on the Shot. The optional maxEdge raises the cap
// for backgrounds — a Definition Card's photo fills a 4:5 canvas that exports
// at 1600×2000, so screenshots keep the 1600 cap while photos cap at 2000.
// Deliberately unit-untested — jsdom has no canvas; this is verified by the
// manual export smoke check (ticket 7).
export const ingestScreenshot = async (file: File, maxEdge?: number): Promise<string> => {
  const screenshot = await createImageBitmap(file)
  const policy = screenshotIngestPolicy(screenshot.width, screenshot.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = policy.width
  canvas.height = policy.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context unavailable')
  // JPEG has no alpha: fill first so transparent areas encode white, not black.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, policy.width, policy.height)
  context.drawImage(screenshot, 0, 0, policy.width, policy.height)
  screenshot.close()
  return canvas.toDataURL(policy.mimeType, policy.quality)
}
