// Centralizes the [DEBUG] logging convention: UTC timestamp, call-site
// context, then the payload — keeps error output uniform and greppable.
export const logDebug = (context: string, message: string, detail?: unknown): void => {
  const prefix = `[DEBUG] ${new Date().toISOString()} ${context}: ${message}`
  if (detail === undefined) {
    console.error(prefix)
  } else {
    console.error(prefix, detail)
  }
}
