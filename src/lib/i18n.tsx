import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Interface Language: the language the UI Copy is displayed in.
 * Never affects Card Content (see GLOSSARY.md).
 */
// Single-file i18n module is the spec-bound layout (dictionaries + resolver +
// provider + hook), so fast refresh can't split it — remount-on-edit is fine.
// oxlint-disable react/only-export-components
export type Language = 'vi' | 'en'

/** localStorage key persisting the manually chosen Interface Language. */
export const UI_LANGUAGE_STORAGE_KEY = 'social-card.ui-language'

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
  style_presets_label: 'Mẫu phong cách',
  style_preset_classic: 'Cổ điển',
  style_preset_midnight: 'Đêm thẫm',
  style_preset_minimal: 'Tối giản',
  style_preset_billboard: 'Áp phích',
  undo_button_title: 'Hoàn tác (Ctrl+Z)',
  redo_button_title: 'Làm lại (Ctrl+Shift+Z)',
  inspector_toggle_title: 'Ẩn/hiện bảng điều khiển (Ctrl+\\)',
  copy_button: 'Copy ảnh',
  copy_button_done: 'Đã copy vào Clipboard!',
  download_button: 'Tải PNG 2x',
  ratio_cycle_title: 'Bấm để chuyển đổi tỷ lệ khung hình',
  inspector_footer_layout: 'Bố cục Apple HIG',
  inspector_toggle_shortcut_hint: '⌘\\ Ẩn/hiện bảng',
  presets_badge: 'Mẫu 1-chạm',
  sublines_badge: 'Nhiều dòng',
  state_on: 'BẬT',
  state_off: 'TẮT',
  qr_cta_placeholder: 'Build Trợ lý AI cho riêng bạn!',

  card_type_label: 'Loại Card',
  card_type_quote: 'Trích dẫn',
  card_type_showcase: 'Giới thiệu',

  shots_label: 'Ảnh chụp màn hình',
  shots_add: 'Thêm ảnh',
  shots_cap_hint: 'Tối đa 3 ảnh cho một card. Xóa bớt để thêm ảnh khác.',
  shots_remove_title: 'Xóa ảnh',
  shot_file_error: 'Không thể đọc ảnh chụp màn hình. Vui lòng thử file khác!',
  shot_fit_label: 'Hiển thị ảnh',
  shot_fit_auto: 'Tự động',
  shot_fit_cover: 'Đầy khung',
  shot_fit_contain: 'Trọn ảnh',
  shot_reset_label: 'Đặt lại',
  shot_done_label: 'Xong',
  annotations_label: 'Ghi chú',
  annotations_add: 'Thêm ghi chú',
  annotations_text_label: 'Nội dung ghi chú',
  annotations_text_hint: 'Ví dụ: Tổng quan ý tưởng',
  annotations_target_label: 'Ảnh đích',
  annotations_side_label: 'Vị trí',
  annotation_side_left: 'Trái',
  annotation_side_right: 'Phải',
  annotation_side_top: 'Trên',
  annotations_remove_title: 'Xóa ghi chú',
  annotations_cap_hint: 'Mỗi ảnh có tối đa một ghi chú.',
  annotations_needs_shot_hint: 'Thêm ảnh chụp màn hình trước khi ghi chú.',

  inspector_title: 'Tùy chỉnh Card',
  reset_title: 'Đặt lại mặc định',
  reset_button: 'Mặc định',
  presets_label: 'Mẫu nhanh',
  preset_original: 'Mẫu gốc (Tậu đất)',
  preset_ship_ai: 'Ship dự án AI mới',
  preset_tech_note: 'Tech Note / Quote',
  preset_quote: 'Trích dẫn',
  ratio_label: 'Tỉ lệ khung hình',
  ratio_square: '1:1 Vuông',
  ratio_portrait: '4:5 Dọc',
  ratio_landscape: '16:9 Ngang',
  theme_label: 'Màu nền',
  theme_paper: 'Giấy ngà',
  theme_white: 'Trắng tinh',
  theme_dark: 'Tối OLED',
  theme_mist: 'Sương',
  headline_label: 'Tiêu đề chính',
  uppercase_label: 'In hoa',
  headline_size_label: 'Cỡ chữ tiêu đề',
  sublines_label: 'Nội dung chi tiết / Links',
  bold_sublines_label: 'Subline đậm',
  sublines_hint: 'Mỗi dòng một ý, ví dụ: threads.net/@nampq',
  author_label: 'Thông tin tác giả',
  avatar_row_title: 'Ảnh đại diện',
  avatar_row_subtitle: 'Hiển thị ở góc dưới Card',
  avatar_alt: 'Avatar',
  change_photo: 'Đổi ảnh',
  original_avatar: 'Dùng avatar gốc',
  grayscale_avatar_label: 'Avatar đen trắng',
  author_name_label: 'Tên',
  author_bio_label: 'Bio / Chức danh',
  qr_label: 'Mã QR & Kêu gọi',
  qr_toggle_title: 'Hiển thị Mã QR & Lời kêu gọi',
  qr_url_label: 'Link liên kết',
  qr_url_row_label: 'Link liên kết (Quét mã QR)',
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
  zoom_fit_title: 'Vừa khung xem trước',

  tab_content: 'Nội dung',
  tab_style: 'Kiểu',
  tab_identity: 'Định danh',
  sheet_toggle_title: 'Mở hoặc thu gọn bảng tùy chỉnh',
  tips_title: 'Gợi ý đăng bài',

  posting_tips: (
    <>
      Tỉ lệ <code className="font-mono text-neutral-700 dark:text-neutral-300">1:1</code> và{' '}
      <code className="font-mono text-neutral-700 dark:text-neutral-300">4:5</code> hiển thị hoàn
      hảo nhất trên dòng thời gian di động của Threads và X. Dùng tính năng{' '}
      <strong>Copy ảnh</strong> để dán trực tiếp vào bài viết mà không cần tải và lưu file rác.
    </>
  ) as ReactNode,

  empty_headline_hint: 'NHẬP TIÊU ĐỀ TẠI ĐÂY',

  onboarding_welcome_title: 'Chào mừng đến Social Card!',
  onboarding_welcome_body:
    'Tạo ảnh chia sẻ chuẩn tỉ lệ cho Threads, X & Facebook trong vài chục giây.',
  onboarding_tour_cta: 'Khám phá 30 giây',
  onboarding_skip: 'Bỏ qua, dùng ngay',

  tour_step_canvas_title: 'Ảnh xem trước trực tiếp',
  tour_step_canvas_body: 'Mọi chỉnh sửa cập nhật ngay tại đây. Card luôn sẵn sàng để chia sẻ.',
  tour_step_inspector_title: 'Bảng điều khiển',
  tour_step_inspector_body: 'Sửa tiêu đề, nội dung chi tiết và chọn Mẫu nhanh trong tab Nội dung.',
  tour_step_tabs_title: 'Đổi kiểu & định danh',
  tour_step_tabs_body:
    'Tab Kiểu đổi tỉ lệ khung hình và màu nền; tab Định danh cho avatar, tên và mã QR.',
  tour_step_export_title: 'Xuất ảnh trong 1 nhấp',
  tour_step_export_body:
    'Copy ảnh rồi dán (Ctrl+V) thẳng vào Threads/X, hoặc tải PNG chuẩn Retina.',
  tour_next: 'Tiếp',
  tour_prev: 'Lùi',
  tour_skip: 'Bỏ qua',
  tour_finish: 'Xong',
  tour_close: 'Đóng hướng dẫn',
  replay_tour: 'Xem lại hướng dẫn',
  tour_fit_slot_title: 'Ảnh của bạn điều khiển được',
  tour_fit_slot_body:
    'Kéo để di chuyển, pinch hoặc Ctrl + cuộn để zoom. Nhấp đúp để phóng tại một điểm.',
  tour_fit_override_title: 'Chọn cách hiển thị từng ảnh',
  tour_fit_override_body:
    'Ảnh lệch tỷ lệ tự hiển thị toàn bộ. Đổi Cover/Contain riêng cho từng ảnh trong tab Nội dung.',
}

/** A UI Copy dictionary key — lets constants (e.g. presets) reference copy by name. */
export type UiCopyKey = keyof typeof vi

/**
 * UI Copy keys whose value is plain text (excludes JSX fragments like the
 * posting tips). Use it wherever a copy key must yield a string — aria
 * labels, option labels — not just children content.
 */
export type UiStringKey = {
  [K in keyof typeof vi]: (typeof vi)[K] extends string ? K : never
}[keyof typeof vi]

const en: typeof vi = {
  header_tagline: 'Pixel-perfect card images for X, Threads & Facebook',
  language_toggle_title: 'Switch interface language',
  style_presets_label: 'Style presets',
  style_preset_classic: 'Classic',
  style_preset_midnight: 'Midnight',
  style_preset_minimal: 'Minimal',
  style_preset_billboard: 'Billboard',
  undo_button_title: 'Undo (Ctrl+Z)',
  redo_button_title: 'Redo (Ctrl+Shift+Z)',
  inspector_toggle_title: 'Toggle panel (Ctrl+\\)',
  copy_button: 'Copy image',
  copy_button_done: 'Copied to clipboard!',
  download_button: 'Download PNG 2x',
  ratio_cycle_title: 'Click to cycle aspect ratio',
  inspector_footer_layout: 'Apple HIG Layout',
  inspector_toggle_shortcut_hint: '⌘\\ Toggle panel',
  presets_badge: '1-click template',
  sublines_badge: 'Multi-line',
  state_on: 'ON',
  state_off: 'OFF',
  qr_cta_placeholder: 'Build your own AI assistant!',

  card_type_label: 'Card type',
  card_type_quote: 'Quote',
  card_type_showcase: 'Showcase',

  shots_label: 'Screenshots',
  shots_add: 'Add screenshot',
  shots_cap_hint: 'Up to 3 shots per card. Remove one to add another.',
  shots_remove_title: 'Remove screenshot',
  shot_file_error: "Couldn't read that screenshot. Try a different file!",
  shot_fit_label: 'Shot display',
  shot_fit_auto: 'Auto',
  shot_fit_cover: 'Fill',
  shot_fit_contain: 'Fit',
  shot_reset_label: 'Reset',
  shot_done_label: 'Done',
  annotations_label: 'Annotations',
  annotations_add: 'Add annotation',
  annotations_text_label: 'Annotation text',
  annotations_text_hint: 'e.g. Overview of the idea',
  annotations_target_label: 'Target shot',
  annotations_side_label: 'Position',
  annotation_side_left: 'Left',
  annotation_side_right: 'Right',
  annotation_side_top: 'Top',
  annotations_remove_title: 'Remove annotation',
  annotations_cap_hint: 'One annotation per screenshot.',
  annotations_needs_shot_hint: 'Add a screenshot before annotating it.',

  inspector_title: 'Customize card',
  reset_title: 'Reset to defaults',
  reset_button: 'Reset',
  presets_label: 'Quick presets',
  preset_original: 'Original sample (Bought land)',
  preset_ship_ai: 'Just shipped an AI project',
  preset_tech_note: 'Tech Note / Quote',
  preset_quote: 'Quote',
  ratio_label: 'Aspect ratio',
  ratio_square: '1:1 Square',
  ratio_portrait: '4:5 Portrait',
  ratio_landscape: '16:9 Landscape',
  theme_label: 'Background theme',
  theme_paper: 'Ivory paper',
  theme_white: 'Pure white',
  theme_dark: 'OLED dark',
  theme_mist: 'Mist',
  headline_label: 'Main headline',
  uppercase_label: 'Uppercase',
  headline_size_label: 'Headline size',
  sublines_label: 'Details / links',
  bold_sublines_label: 'Bold sublines',
  sublines_hint: 'One per line, e.g. threads.net/@nampq',
  author_label: 'Author info',
  avatar_row_title: 'Profile photo',
  avatar_row_subtitle: 'Shown at the bottom of the card',
  avatar_alt: 'Avatar',
  change_photo: 'Change photo',
  original_avatar: 'Use original avatar',
  grayscale_avatar_label: 'Grayscale avatar',
  author_name_label: 'Name',
  author_bio_label: 'Bio / title',
  qr_label: 'QR code & call to action',
  qr_toggle_title: 'Show QR code & call to action',
  qr_url_label: 'Link',
  qr_url_row_label: 'Link (scanned by the QR)',
  qr_cta_label: 'Call-to-action text beside QR',
  avatar_read_error: "Couldn't read that image. Try a different file!",
  avatar_file_error: "Couldn't read the image file. Please try again!",
  avatar_too_large: 'That image is over 5 MB. Please choose a smaller file!',

  copy_processing: 'Processing Retina image...',
  copy_success: 'Image copied! Paste (Ctrl+V) straight into Threads or X.',
  copy_error: "Couldn't copy to clipboard. Try downloading the PNG instead!",
  download_processing: 'Rendering PNG 2x file...',
  download_success: 'Image downloaded successfully!',
  download_error: 'Download failed. Please try again!',
  zoom_out_title: 'Zoom out preview',
  zoom_in_title: 'Zoom in preview',
  zoom_fit_title: 'Fit preview to view',

  tab_content: 'Content',
  tab_style: 'Style',
  tab_identity: 'Identity',
  sheet_toggle_title: 'Expand or collapse the panel',
  tips_title: 'Posting tips',

  posting_tips: (
    <>
      The <code className="font-mono text-neutral-700 dark:text-neutral-300">1:1</code> and{' '}
      <code className="font-mono text-neutral-700 dark:text-neutral-300">4:5</code> ratios look best
      on the mobile timelines of Threads and X. Use <strong>Copy image</strong> to paste straight
      into your post — no stray files to download and delete.
    </>
  ) as ReactNode,

  empty_headline_hint: 'ENTER YOUR HEADLINE HERE',

  onboarding_welcome_title: 'Welcome to Social Card!',
  onboarding_welcome_body:
    'Create share-ready card images for Threads, X & Facebook in under a minute.',
  onboarding_tour_cta: 'Take the 30s tour',
  onboarding_skip: 'Skip, I will explore',

  tour_step_canvas_title: 'Live preview',
  tour_step_canvas_body: 'Every edit updates this card instantly. It is always ready to share.',
  tour_step_inspector_title: 'The Inspector',
  tour_step_inspector_body: 'Edit the headline, sublines and pick a Preset in the Content tab.',
  tour_step_tabs_title: 'Style & identity',
  tour_step_tabs_body:
    'The Style tab switches ratio and background; Identity holds your avatar, name and QR.',
  tour_step_export_title: 'Export in one click',
  tour_step_export_body:
    'Copy the image and paste (Ctrl+V) straight into Threads/X, or download Retina PNG.',
  tour_next: 'Next',
  tour_prev: 'Back',
  tour_skip: 'Skip',
  tour_finish: 'Finish',
  tour_close: 'Close tour',
  replay_tour: 'Replay the guide',
  tour_fit_slot_title: 'Your shots are hands-on',
  tour_fit_slot_body:
    'Drag to pan, pinch or Ctrl+scroll to zoom. Double-click to focus on a detail.',
  tour_fit_override_title: 'Choose how each shot renders',
  tour_fit_override_body:
    'Mismatched shots show whole by default. Override Cover/Contain per shot in the Content tab.',
}

export const dictionaries: Record<Language, typeof vi> = { vi, en }

/**
 * Initial Interface Language is ALWAYS Vietnamese (no browser detection);
 * only a persisted valid value wins. Pure so tests inject storage fakes
 * and the provider stays thin.
 */
export function resolveInitialLanguage(storage: { getItem(key: string): string | null }): Language {
  const stored = storage.getItem(UI_LANGUAGE_STORAGE_KEY)
  return stored === 'vi' || stored === 'en' ? stored : 'vi'
}

type UiCopyContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  copy: typeof vi
}

const UiCopyContext = createContext<UiCopyContextValue | null>(null)

export function UiCopyProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    resolveInitialLanguage(window.localStorage),
  )

  // Persist only manual choices; loading never writes to storage.
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, next)
  }, [])

  // Keep the document language in sync for screen readers and translators.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, copy: dictionaries[language] }),
    [language, setLanguage],
  )

  return <UiCopyContext.Provider value={value}>{children}</UiCopyContext.Provider>
}

/** Whole-dictionary lookup: `const { language, setLanguage, copy } = useUiCopy()`. */
export function useUiCopy(): UiCopyContextValue {
  const context = useContext(UiCopyContext)
  if (!context) {
    throw new Error('useUiCopy must be used within a UiCopyProvider')
  }
  return context
}
