import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Interface Language: the language the UI Copy is displayed in.
 * Never affects Card Content (see GLOSSARY.md).
 */
// Single-file i18n module is the spec-bound layout (dictionaries + resolver +
// provider + hook), so fast refresh can't split it — remount-on-edit is fine.
// oxlint-disable react/only-export-components
export type Language = 'vi' | 'en';

/** localStorage key persisting the manually chosen Interface Language. */
export const UI_LANGUAGE_STORAGE_KEY = 'social-card.ui-language';

/**
 * UI Copy dictionary — everything the tool itself says (GLOSSARY.md).
 * Flat, single-level; `vi` is defined first so `en: typeof vi` makes the
 * compiler enforce identical key sets and value types per key.
 * Plain strings everywhere, except `posting_tips`, the one `ReactNode`-typed
 * value: it carries inline `<strong>`/`<code>` emphasis that plain strings
 * cannot express, and keeps the same JSX structure in both languages.
 */
const vi = {
  header_tagline: 'Tạo ảnh chuẩn mẫu cho X, Threads & Facebook',
  language_toggle_title: 'Đổi ngôn ngữ giao diện',
  copy_button: 'Copy ảnh (Ctrl+V)',
  copy_button_done: 'Đã copy vào Clipboard!',
  download_button: 'Tải PNG 2x',

  inspector_title: 'Tùy chỉnh Card',
  reset_title: 'Đặt lại mặc định',
  reset_button: 'Mặc định',
  presets_label: 'Mẫu nhanh',
  preset_original: 'Mẫu gốc (Tậu đất)',
  preset_ship_ai: 'Ship dự án AI mới',
  preset_tech_note: 'Tech Note / Quote',
  ratio_label: 'Tỉ lệ khung hình',
  ratio_square: '1:1 Vuông',
  ratio_portrait: '4:5 Dọc',
  ratio_landscape: '16:9 Ngang',
  theme_label: 'Màu nền',
  theme_paper: 'Giấy ngà',
  theme_white: 'Trắng tinh',
  theme_dark: 'Tối OLED',
  headline_label: 'Tiêu đề chính',
  uppercase_label: 'In hoa',
  headline_size_label: 'Cỡ chữ tiêu đề',
  sublines_label: 'Nội dung chi tiết / Links',
  sublines_hint: 'Mỗi dòng một ý, ví dụ: threads.net/@nampq',
  author_label: 'Thông tin tác giả',
  avatar_alt: 'Avatar',
  change_photo: 'Đổi ảnh',
  original_avatar: 'Dùng avatar gốc',
  author_name_label: 'Tên',
  author_bio_label: 'Bio / Chức danh',
  qr_label: 'Mã QR & Kêu gọi',
  qr_url_label: 'Link liên kết',
  qr_cta_label: 'Nội dung kêu gọi bên cạnh QR',
  avatar_read_error: 'Không đọc được nội dung ảnh. Vui lòng thử file khác!',
  avatar_file_error: 'Không thể đọc file ảnh. Vui lòng thử lại!',
  avatar_too_large: 'Ảnh quá lớn (tối đa 5 MB). Vui lòng chọn file nhỏ hơn!',

  copy_processing: 'Đang xử lý ảnh Retina...',
  copy_success: 'Đã copy ảnh! Bạn có thể dán (Ctrl+V) ngay vào Threads hoặc X.',
  copy_error: 'Không thể copy vào clipboard. Hãy thử tải ảnh PNG!',
  download_processing: 'Đang kết xuất file PNG 2x...',
  download_success: 'Đã tải ảnh về máy thành công!',
  download_error: 'Lỗi khi tải ảnh. Vui lòng thử lại!',
  zoom_out_title: 'Thu nhỏ xem trước',
  zoom_in_title: 'Phóng to xem trước',

  posting_tips: (
    <>
      <strong className="text-neutral-700 dark:text-neutral-300">Gợi ý đăng bài:</strong>{' '}
      Tỉ lệ <code className="font-mono text-neutral-700 dark:text-neutral-300">1:1</code>{' '}
      và <code className="font-mono text-neutral-700 dark:text-neutral-300">4:5</code> hiển thị
      hoàn hảo nhất trên dòng thời gian di động của Threads và X. Dùng tính năng{' '}
      <strong>Copy ảnh</strong> để dán trực tiếp vào bài viết mà không cần tải và lưu file rác.
    </>
  ) as ReactNode,

  empty_headline_hint: 'NHẬP TIÊU ĐỀ TẠI ĐÂY',
};

/** A UI Copy dictionary key — lets constants (e.g. presets) reference copy by name. */
export type UiCopyKey = keyof typeof vi;

const en: typeof vi = {
  header_tagline: 'Pixel-perfect card images for X, Threads & Facebook',
  language_toggle_title: 'Switch interface language',
  copy_button: 'Copy image (Ctrl+V)',
  copy_button_done: 'Copied to clipboard!',
  download_button: 'Download PNG 2x',

  inspector_title: 'Customize card',
  reset_title: 'Reset to defaults',
  reset_button: 'Reset',
  presets_label: 'Quick presets',
  preset_original: 'Original sample (Bought land)',
  preset_ship_ai: 'Just shipped an AI project',
  preset_tech_note: 'Tech Note / Quote',
  ratio_label: 'Aspect ratio',
  ratio_square: '1:1 Square',
  ratio_portrait: '4:5 Portrait',
  ratio_landscape: '16:9 Landscape',
  theme_label: 'Background theme',
  theme_paper: 'Ivory paper',
  theme_white: 'Pure white',
  theme_dark: 'OLED dark',
  headline_label: 'Main headline',
  uppercase_label: 'Uppercase',
  headline_size_label: 'Headline size',
  sublines_label: 'Details / links',
  sublines_hint: 'One per line, e.g. threads.net/@nampq',
  author_label: 'Author info',
  avatar_alt: 'Avatar',
  change_photo: 'Change photo',
  original_avatar: 'Use original avatar',
  author_name_label: 'Name',
  author_bio_label: 'Bio / title',
  qr_label: 'QR code & call to action',
  qr_url_label: 'Link',
  qr_cta_label: 'Call-to-action text beside QR',
  avatar_read_error: 'Couldn\'t read that image. Try a different file!',
  avatar_file_error: 'Couldn\'t read the image file. Please try again!',
  avatar_too_large: 'That image is over 5 MB. Please choose a smaller file!',

  copy_processing: 'Processing Retina image...',
  copy_success: 'Image copied! Paste (Ctrl+V) straight into Threads or X.',
  copy_error: 'Couldn\'t copy to clipboard. Try downloading the PNG instead!',
  download_processing: 'Rendering PNG 2x file...',
  download_success: 'Image downloaded successfully!',
  download_error: 'Download failed. Please try again!',
  zoom_out_title: 'Zoom out preview',
  zoom_in_title: 'Zoom in preview',

  posting_tips: (
    <>
      <strong className="text-neutral-700 dark:text-neutral-300">Posting tips:</strong> The{' '}
      <code className="font-mono text-neutral-700 dark:text-neutral-300">1:1</code> and{' '}
      <code className="font-mono text-neutral-700 dark:text-neutral-300">4:5</code> ratios look
      best on the mobile timelines of Threads and X. Use <strong>Copy image</strong> to paste
      straight into your post — no stray files to download and delete.
    </>
  ) as ReactNode,

  empty_headline_hint: 'ENTER YOUR HEADLINE HERE',
};

export const dictionaries: Record<Language, typeof vi> = { vi, en };

/**
 * Initial Interface Language is ALWAYS Vietnamese (no browser detection);
 * only a persisted valid value wins. Pure so tests inject storage fakes
 * and the provider stays thin.
 */
export function resolveInitialLanguage(
  storage: { getItem(key: string): string | null }
): Language {
  const stored = storage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return stored === 'vi' || stored === 'en' ? stored : 'vi';
}

type UiCopyContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  copy: typeof vi;
};

const UiCopyContext = createContext<UiCopyContextValue | null>(null);

export function UiCopyProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    resolveInitialLanguage(window.localStorage)
  );

  // Persist only manual choices; loading never writes to storage.
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, next);
  }, []);

  // Keep the document language in sync for screen readers and translators.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, copy: dictionaries[language] }),
    [language, setLanguage]
  );

  return <UiCopyContext.Provider value={value}>{children}</UiCopyContext.Provider>;
}

/** Whole-dictionary lookup: `const { language, setLanguage, copy } = useUiCopy()`. */
export function useUiCopy(): UiCopyContextValue {
  const context = useContext(UiCopyContext);
  if (!context) {
    throw new Error('useUiCopy must be used within a UiCopyProvider');
  }
  return context;
}
