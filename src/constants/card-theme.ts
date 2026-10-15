// Theme class tokens shared with tests so assertions check the token, not a
// raw hex literal. Classes reference the static card-* tokens in index.css:
// a card theme paints the exported image, so its colors never respond to the
// OS color scheme (guard: card-theme.test.ts + smoke:theme). qrFg is an SVG
// attribute, not a class — keep each literal equal to its theme's ink/bg
// token value; the export smoke catches drift on real pixels.
export const CARD_THEME_STYLES = {
  white: {
    bg: 'bg-white',
    text: 'text-card-white-ink',
    subtext: 'text-card-white-muted',
    qrBg: 'bg-white',
    qrFg: '#111111',
    border: 'border-black/5',
    avatarBorder: 'ring-1 ring-black/10',
  },
  paper: {
    bg: 'bg-card-paper',
    text: 'text-card-paper-ink',
    subtext: 'text-card-paper-muted',
    qrBg: 'bg-white',
    qrFg: '#1D1D1F',
    border: 'border-stone-200/60',
    avatarBorder: 'ring-1 ring-stone-300',
  },
  dark: {
    bg: 'bg-card-dark',
    text: 'text-card-dark-ink',
    subtext: 'text-card-dark-muted',
    qrBg: 'bg-white',
    qrFg: '#121214',
    border: 'border-white/10',
    avatarBorder: 'ring-1 ring-white/20',
  },
  mist: {
    bg: 'bg-card-mist',
    text: 'text-card-mist-ink',
    subtext: 'text-card-mist-muted',
    qrBg: 'bg-white',
    qrFg: '#101113',
    border: 'border-slate-300/60',
    avatarBorder: 'ring-1 ring-slate-400/50',
  },
} as const
