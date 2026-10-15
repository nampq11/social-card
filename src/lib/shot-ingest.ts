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

// Scale factor that caps the longer edge at SHOT_MAX_EDGE; 1 means untouched.
const capScale = (width: number, height: number): number =>
  Math.min(1, SHOT_MAX_EDGE / Math.max(width, height))

// Pure normalization policy for one uploaded screenshot: given its natural
// dimensions, returns the dimensions to draw (long edge capped at
// SHOT_MAX_EDGE, aspect preserved) and the encode decision — always a JPEG
// re-encode, whatever the source format. No DOM, no canvas — the thin wrapper
// (ingestScreenshot) supplies those, which is why this is unit-tested while
// the wrapper is not (jsdom has no canvas).
export const screenshotIngestPolicy = (width: number, height: number): ScreenshotPolicy => {
  const scale = capScale(width, height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    mimeType: 'image/jpeg',
    quality: SHOT_JPEG_QUALITY,
  }
}

// Thin canvas wrapper around screenshotIngestPolicy: loads the picked file,
// draws it at the policy's dimensions, and encodes with the policy's decision
// into the data URL stored on the Shot. Deliberately unit-untested — jsdom
// has no canvas; this is verified by the manual export smoke check (ticket 7).
export const ingestScreenshot = async (file: File): Promise<string> => {
  const screenshot = await createImageBitmap(file)
  const policy = screenshotIngestPolicy(screenshot.width, screenshot.height)
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
