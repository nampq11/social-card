// The factory Shot (800×450 flat-design "app screenshot", ~3.8 KB PNG):
// DEFAULT_CARD_STATE opens a Showcase card holding it, so a first-run
// visitor's tour has a live Screenshot Slot to gesture on (its hero-slot
// anchor resolves) and the studio never opens on an empty collage. Served
// as a static public asset (like avatar.png) rather than an inline base64
// string, so the bytes stay out of the entry JS; the URL is deterministic,
// so every session boots identical.
export const DEMO_SHOT_ID = 'shot-demo'

export const DEMO_SHOT_URL = `${import.meta.env.BASE_URL}demo-shot.png`
