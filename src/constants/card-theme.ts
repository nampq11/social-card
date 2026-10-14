// Theme class tokens shared with tests so assertions check the token, not a raw hex literal
export const CARD_THEME_STYLES = {
  white: {
    bg: 'bg-white',
    text: 'text-[#111111]',
    subtext: 'text-[#555558]',
    qrBg: 'bg-white',
    qrFg: '#111111',
    border: 'border-black/5',
    avatarBorder: 'ring-1 ring-black/10',
  },
  paper: {
    bg: 'bg-[#FAF9F5]',
    text: 'text-[#1D1D1F]',
    subtext: 'text-[#424245]',
    qrBg: 'bg-white',
    qrFg: '#1D1D1F',
    border: 'border-stone-200/60',
    avatarBorder: 'ring-1 ring-stone-300',
  },
  dark: {
    bg: 'bg-[#121214]',
    text: 'text-[#F4F4F5]',
    subtext: 'text-[#A1A1AA]',
    qrBg: 'bg-white',
    qrFg: '#121214',
    border: 'border-white/10',
    avatarBorder: 'ring-1 ring-white/20',
  },
  mist: {
    bg: 'bg-[#E8EDF0]',
    text: 'text-[#101113]',
    subtext: 'text-[#3D4046]',
    qrBg: 'bg-white',
    qrFg: '#101113',
    border: 'border-slate-300/60',
    avatarBorder: 'ring-1 ring-slate-400/50',
  },
} as const
