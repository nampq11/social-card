// Centralizes the [DEBUG] logging convention: UTC timestamp, call-site
// context, then the payload — keeps error output uniform and greppable.
export const logDebug = (context: string, message: string, detail?: unknown): void => {
  const timestamp = new Date().toISOString();
  if (detail === undefined) {
    console.error(`[DEBUG] ${timestamp} ${context}: ${message}`);
  } else {
    console.error(`[DEBUG] ${timestamp} ${context}: ${message}`, detail);
  }
};
