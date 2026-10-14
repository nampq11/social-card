import type { CardState } from '../types'
import type { UiCopyKey } from '../lib/i18n'

// Shared fallbacks so the preview placeholders and the default state never
// drift apart.
export const FALLBACK_AUTHOR_NAME = 'Nam Phạm'
export const FALLBACK_QR_URL = 'https://github.com/nampq11'

// Headlines are stored in sentence case; the Uppercase toggle drives the
// casing at render time, so unchecking it has to visibly change the card.
export const DEFAULT_CARD_STATE: CardState = {
  headline: 'Em vừa được tậu đất:',
  sublines: 'github.com/nampq11\nthreads.net/@nampq',
  authorName: FALLBACK_AUTHOR_NAME,
  authorBio: 'AI Engineer • Building AI Agents',
  avatarUrl: `${import.meta.env.BASE_URL}avatar.png`,
  qrEnabled: true,
  qrUrl: FALLBACK_QR_URL,
  qrCta: 'Build Trợ lý AI cho riêng bạn!',
  ratio: '1:1',
  theme: 'paper',
  headlineSize: 42,
  uppercaseHeadline: true,
  boldSublines: false,
}

// Preset names are UI Copy (button labels) — resolved through the dictionary
// at render time, never stored on the state.
export interface SamplePreset {
  id: string
  nameKey: UiCopyKey
  state: Partial<CardState>
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'original',
    nameKey: 'preset_original',
    state: {
      headline: 'Em vừa được tậu đất:',
      sublines: 'lanphinh.com\nlanphinh.io',
      qrCta: 'Build Trợ lý AI cho riêng bạn!',
      theme: 'white',
      uppercaseHeadline: true,
    },
  },
  {
    id: 'ship-ai',
    nameKey: 'preset_ship_ai',
    state: {
      headline: 'Vừa ship xong dự án AI mới:',
      sublines: 'github.com/nampq11/social-card\nTrải nghiệm ngay tại link bên dưới 👇',
      qrCta: 'Quét để xem mã nguồn dự án!',
      theme: 'paper',
      uppercaseHeadline: true,
    },
  },
  {
    id: 'tech-note',
    nameKey: 'preset_tech_note',
    state: {
      headline: 'Less code = less bugs',
      sublines:
        'Sự đơn giản luôn là đỉnh cao của độ tin cậy.\nĐừng vội over-engineer khi bài toán còn chưa rõ ràng.',
      qrCta: 'Theo dõi để nhận thêm mẹo AI & Dev',
      theme: 'dark',
      uppercaseHeadline: true,
    },
  },
]

// Style Presets (GLOSSARY.md) restyle the card without touching any Card
// Content field: one click writes the full style quadruple as a single
// undoable step. Preset names are UI Copy — resolved through the dictionary
// at render time, never stored on the state.
export type StylePresetState = Pick<
  CardState,
  'theme' | 'ratio' | 'headlineSize' | 'uppercaseHeadline'
>

export interface StylePreset {
  id: string
  nameKey: UiCopyKey
  state: StylePresetState
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'classic',
    nameKey: 'style_preset_classic',
    state: { theme: 'paper', ratio: '1:1', headlineSize: 42, uppercaseHeadline: true },
  },
  {
    id: 'midnight',
    nameKey: 'style_preset_midnight',
    state: { theme: 'dark', ratio: '4:5', headlineSize: 46, uppercaseHeadline: true },
  },
  {
    id: 'minimal',
    nameKey: 'style_preset_minimal',
    state: { theme: 'white', ratio: '1:1', headlineSize: 34, uppercaseHeadline: false },
  },
  {
    id: 'billboard',
    nameKey: 'style_preset_billboard',
    state: { theme: 'dark', ratio: '16:9', headlineSize: 54, uppercaseHeadline: true },
  },
]
