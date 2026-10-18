// The Definition Card's factory background (1280×1600 abstract "flower field
// under an overcast sky" JPEG, ~115 KB, generated in-house so the repo ships
// no third-party photography): DEFAULT_CARD_STATE's definition nest holds it,
// so the first switch to Definition already shows a complete photo card and
// the scrim slider has a real photo to darken. Imported through Vite's asset
// pipeline like the avatar and demo shot (hashed /assets/ file at this size);
// same-origin, so Card Export inlines it without CORS trouble.
import demoBackgroundUrl from '../assets/demo-background.jpg'

export const DEMO_BACKGROUND_URL = demoBackgroundUrl
