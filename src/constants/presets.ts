import type { CardState } from '../types';

export const DEFAULT_CARD_STATE: CardState = {
  headline: 'EM VỪA ĐƯỢC TẬU ĐẤT:',
  sublines: 'github.com/nampq11\nthreads.net/@nampq',
  authorName: 'Nam Pham',
  authorBio: 'AI Engineer • Building AI Agents',
  avatarUrl: '/avatar.png',
  qrEnabled: true,
  qrUrl: 'https://github.com/nampq11',
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
