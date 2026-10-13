import type { Language } from '../lib/i18n';
import type { AspectRatio } from '../types';

// Multiplier applied to preview dimensions when rendering the exported PNG.
export const EXPORT_PIXEL_RATIO = 2.5;

interface RatioInfo {
  width: number;
  height: number;
  name: string;
  // Per-language UI Copy; the ratio names themselves stay untranslated.
  platform: Record<Language, string>;
}

// Single source of truth for card dimensions. The preview and the toolbar
// label both read from here, so the advertised export size (preview size ×
// EXPORT_PIXEL_RATIO) can never drift from the real one.
export const RATIO_INFO: Record<AspectRatio, RatioInfo> = {
  '1:1': {
    width: 720,
    height: 720,
    name: 'Square',
    platform: { vi: 'Threads, X, Instagram', en: 'Threads, X, Instagram' },
  },
  '4:5': {
    width: 640,
    height: 800,
    name: 'Portrait',
    platform: { vi: 'Tối ưu màn hình Mobile', en: 'Optimized for mobile screens' },
  },
  '16:9': {
    width: 800,
    height: 450,
    name: 'Landscape',
    platform: { vi: 'X Card, Facebook Post', en: 'X Card, Facebook Post' },
  },
};

export const ratioLabel = (ratio: AspectRatio, language: Language): string => {
  const { width, height, name, platform } = RATIO_INFO[ratio];
  return `${name} (${width * EXPORT_PIXEL_RATIO} × ${height * EXPORT_PIXEL_RATIO} px) — ${platform[language]}`;
};
