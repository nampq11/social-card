import type { CardState } from '../types';

// Shared fallbacks so the preview placeholders and the default state never
// drift apart.
export const FALLBACK_AUTHOR_NAME = 'Nam Pham';
export const FALLBACK_QR_URL = 'https://github.com/nampq11';

export const DEFAULT_CARD_STATE: CardState = {
  headline: 'EM VỪA ĐƯỢC TẬU ĐẤT:',
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
};

export const SAMPLE_PRESETS: { name: string; state: Partial<CardState> }[] = [
  {
    name: 'Mẫu gốc (Tậu đất)',
    state: {
      headline: 'EM VỪA ĐƯỢC TẬU ĐẤT:',
      sublines: 'lanphinh.com\nlanphinh.io',
      qrCta: 'Build Trợ lý AI cho riêng bạn!',
      theme: 'white',
      uppercaseHeadline: true,
    },
  },
  {
    name: 'Ship dự án AI mới',
    state: {
      headline: 'VỪA SHIP XONG DỰ ÁN AI MỚI:',
      sublines: 'github.com/nampq11/social-card\nTrải nghiệm ngay tại link bên dưới 👇',
      qrCta: 'Quét để xem mã nguồn dự án!',
      theme: 'paper',
      uppercaseHeadline: true,
    },
  },
  {
    name: 'Tech Note / Quote',
    state: {
      headline: 'LESS CODE = LESS BUGS',
      sublines: 'Sự đơn giản luôn là đỉnh cao của độ tin cậy.\nĐừng vội over-engineer khi bài toán còn chưa rõ ràng.',
      qrCta: 'Theo dõi để nhận thêm mẹo AI & Dev',
      theme: 'dark',
      uppercaseHeadline: true,
    },
  },
];
