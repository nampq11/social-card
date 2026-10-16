import type { CardState } from '../types'
import type { UiCopyKey, UiStringKey } from '../lib/i18n'
import { DEMO_SHOT_ID, DEMO_SHOT_URL } from './demo-shot'
import defaultAvatarUrl from '../assets/avatar.png'

// Shared fallbacks so the preview placeholders and the default state never
// drift apart.
export const FALLBACK_AUTHOR_NAME = 'Nam Phạm'
export const FALLBACK_QR_URL = 'https://github.com/nampq11'

// The factory card is a Showcase holding the demo Shot: the studio opens on
// a filled collage (never an empty dashed frame), and the first-run tour's
// gesture steps always have a live Screenshot Slot to point at. Quote
// fields stay — they are shared content, and switching back to Quote
// restores them untouched (ADR 0004).
export const DEFAULT_CARD_STATE: CardState = {
  cardType: 'showcase',
  showcase: { shots: [{ id: DEMO_SHOT_ID, dataUrl: DEMO_SHOT_URL }], annotations: [] },
  headline: 'Em vừa được tậu đất:',
  sublines: 'github.com/nampq11\nthreads.net/@nampq',
  authorName: FALLBACK_AUTHOR_NAME,
  authorBio: 'AI Engineer • Building AI Agents',
  avatarUrl: defaultAvatarUrl,
  qrEnabled: true,
  qrUrl: FALLBACK_QR_URL,
  qrCta: 'Build Trợ lý AI cho riêng bạn!',
  ratio: '1:1',
  theme: 'paper',
  headlineSize: 42,
  uppercaseHeadline: true,
  boldSublines: false,
  avatarGrayscale: false,
}

// Preset names are UI Copy (button labels) — resolved through the dictionary
// at render time, never stored on the state.
export interface Preset {
  id: string
  nameKey: UiCopyKey
  state: Partial<CardState>
}

// nameKey/descKey stay literal rather than derived from id: only literals
// check against the dictionary unions, so a missing key fails the build.
export const PRESETS: Preset[] = [
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
  {
    id: 'quote',
    nameKey: 'preset_quote',
    // The full replica look in one click. Unlike the other presets it sets
    // the bio: the two-line bio is part of the replica look.
    state: {
      headline: 'Làm ít, làm sâu, làm thật.',
      sublines: 'Ít tính năng hơn.\nÍt lời hứa hơn.\nNhiều giá trị hơn.',
      authorBio: 'Founder độc lập / Build mỗi ngày\nMentor / Nhà đầu tư',
      qrCta: 'Theo dõi hành trình indie!',
      qrEnabled: false,
      theme: 'mist',
      ratio: '1:1',
      headlineSize: 46,
      uppercaseHeadline: true,
      boldSublines: true,
      avatarGrayscale: true,
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
  // Names/descriptions feed string props (PresetCard labels), so they must
  // be plain-text keys, not JSX-valued ones.
  nameKey: UiStringKey
  descKey: UiStringKey
  state: StylePresetState
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'classic',
    nameKey: 'style_preset_classic',
    descKey: 'style_preset_classic_desc',
    state: { theme: 'paper', ratio: '1:1', headlineSize: 42, uppercaseHeadline: true },
  },
  {
    id: 'midnight',
    nameKey: 'style_preset_midnight',
    descKey: 'style_preset_midnight_desc',
    state: { theme: 'dark', ratio: '4:5', headlineSize: 46, uppercaseHeadline: true },
  },
  {
    id: 'minimal',
    nameKey: 'style_preset_minimal',
    descKey: 'style_preset_minimal_desc',
    state: { theme: 'white', ratio: '1:1', headlineSize: 34, uppercaseHeadline: false },
  },
  {
    id: 'billboard',
    nameKey: 'style_preset_billboard',
    descKey: 'style_preset_billboard_desc',
    state: { theme: 'dark', ratio: '16:9', headlineSize: 54, uppercaseHeadline: true },
  },
]
