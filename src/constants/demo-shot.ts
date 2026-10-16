// The factory Shot (800×450 flat-design "app screenshot", ~3.8 KB PNG):
// DEFAULT_CARD_STATE opens a Showcase card holding it, so a first-run
// visitor's tour has a live Screenshot Slot to gesture on (its hero-slot
// anchor resolves) and the studio never opens on an empty collage. Imported
// Imported through Vite's asset pipeline: at ~3.8 KB it sits under Vite's
// inline limit, so it ships as a base64 data URL inside the entry JS —
// no extra roundtrip for an image the factory card paints immediately.
// Larger images would be emitted as hashed files instead, so the same
// import stays correct if the shot ever grows.
import demoShotUrl from '../assets/demo-shot.png'

export const DEMO_SHOT_ID = 'shot-demo'

export const DEMO_SHOT_URL = demoShotUrl
