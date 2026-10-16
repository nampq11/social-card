import { useUiCopy, type Language } from '../../lib/i18n'

/**
 * Landing UI Copy — the marketing page's own bilingual dictionary, kept
 * separate from the studio dictionary in lib/i18n.tsx so ~80 marketing
 * strings never bloat the app's copy module. Same contract though: `vi` is
 * defined first and `en: typeof vi` makes the compiler enforce identical
 * key sets and value shapes per key (strings, and the few structured lists
 * the sections render: points, grid items, FAQ entries).
 */
const vi = {
  // ── Navigation ────────────────────────────────────────────────────────
  nav_features: 'Tính năng',
  nav_cards: 'Loại Card',
  nav_faq: 'Hỏi đáp',
  cta_open_studio: 'Mở studio',

  // ── Hero ──────────────────────────────────────────────────────────────
  hero_badge: 'Studio ảnh chia sẻ, chạy trong trình duyệt',
  hero_title_a: 'Card ảnh đẹp,',
  hero_title_b: 'hoàn thành trong một nhấp.',
  hero_lede:
    'Social Card là studio một màn hình cho ảnh mạng xã hội: Quote Card để kể chuyện, Showcase Card để khoe sản phẩm, mã QR kêu gọi hành động — xuất PNG Retina 2.5× đúng tỉ lệ từng nền tảng, dán thẳng vào Threads hoặc X.',
  hero_trust: 'Không cần tài khoản · Không cài đặt · Miễn phí',
  hero_cta_secondary: 'Xem hai loại Card',
  hero_hint: 'miễn phí, không cần đăng ký!',
  hero_shot_alt:
    'Studio Social Card trên desktop: bảng điều khiển kính mờ bên trái, thẻ Showcase trên canvas chấm',

  // ── Feature marquee ───────────────────────────────────────────────────
  marquee_items: [
    'Quote Card',
    'Showcase Card',
    'Mã QR kêu gọi hành động',
    '4 theme Card',
    '3 tỉ lệ khung hình',
    'Style Presets',
    'Undo & Redo',
    'Tiếng Việt & English',
    'Dark mode',
  ],

  // ── Card types ────────────────────────────────────────────────────────
  cards_eyebrow: 'HAI LOẠI CARD',
  cards_title: 'Kể chuyện, hoặc khoe sản phẩm.',
  cards_lede:
    'Cùng một studio, hai cách kể: chọn loại Card ngay trong bảng điều khiển và đổi qua lại bất cứ lúc nào mà không mất nội dung.',
  quote_name: 'Quote Card',
  quote_desc:
    'Dành cho câu nói, quan điểm, tech note — typography lớn, tác giả và avatar ở chân Card.',
  quote_points: [
    'Tiêu đề lớn, in hoa tùy chọn',
    'Nhiều dòng chi tiết, đậm tùy chọn',
    'Avatar đen trắng cho phong cách thư ký',
  ],
  showcase_name: 'Showcase Card',
  showcase_desc:
    'Dành cho ảnh chụp màn hình sản phẩm — collage hero và chi tiết, tối đa 3 ảnh, ghi chú viết tay chỉ lối.',
  showcase_points: [
    'Collage hero + chi tiết, tối đa 3 ảnh',
    'Ghi chú viết tay (Patrick Hand) chỉ điểm',
    'Chân trang tác giả + mã QR kêu gọi',
  ],
  card_quote_alt: 'Một Quote Card theme Sương với tiêu đề "Làm ít, làm sâu, làm thật."',
  card_showcase_alt: 'Một Showcase Card theme Giấy với ảnh hero và chân trang tác giả',

  // ── One-screen studio ─────────────────────────────────────────────────
  studio_eyebrow: 'MỘT MÀN HÌNH',
  studio_title: 'Sửa là thấy ngay. Trên mọi màn hình.',
  studio_body:
    'Toàn bộ studio gói trong một màn hình: canvas chấm vô hạn ở giữa, bảng điều khiển nổi bên trái, xuất ảnh ngay trên thanh công cụ. Trên điện thoại, bảng điều khiển thu thành tấm sheet dưới đáy — kéo lên để chỉnh, thả xuống để soi Card.',
  studio_points: [
    'Bảng điều khiển kính mờ, gọn trong một cột',
    'Sheet cảm ứng cho điện thoại',
    'Zoom, Fit-to-View và undo ngay tại chỗ',
  ],
  studio_shot_alt:
    'Studio Social Card trên điện thoại: thẻ Card ở giữa màn hình, tấm sheet điều khiển thu gọn dưới đáy',

  // ── Aspect ratios ─────────────────────────────────────────────────────
  ratios_eyebrow: 'ĐÚNG TỈ LỆ',
  ratios_title: 'Sẵn sàng cho từng nền tảng.',
  ratios_lede:
    'Mỗi tỉ lệ xuất đúng số pixel chuẩn của nền tảng — không cần đo lại, không cần cắt lại.',

  // ── Feature grid ──────────────────────────────────────────────────────
  grid_eyebrow: 'ĐỦ DÙNG, KHÔNG THỨ DƯ',
  grid_title: 'Những thứ khác studio làm tốt.',
  grid_items: [
    {
      title: 'Bốn theme Card',
      body: 'Giấy ngà, trắng tinh, tối OLED, sương — Card luôn xuất đúng theme, bất kể giao diện sáng hay tối.',
    },
    {
      title: 'Style Presets',
      body: 'Classic, Midnight, Minimal, Billboard — một nhấp đặt lại toàn bộ kiểu dáng.',
    },
    {
      title: 'Chỉnh ảnh trực quan',
      body: 'Kéo để dời, cuộn để zoom, đúp chuột để tập trung vào một điểm.',
    },
    {
      title: 'Mã QR & lời kêu gọi',
      body: 'Đưa người xem đến link của bạn ngay từ trong ảnh.',
    },
    {
      title: 'Undo & Redo',
      body: 'Mọi chỉnh sửa là một bước lịch sử — Ctrl+Z như trong mọi editor.',
    },
    {
      title: 'Hướng dẫn 30 giây',
      body: 'Tour lần đầu chạy chỉ điểm từng vùng của studio.',
    },
    {
      title: 'Tiếng Việt & English',
      body: 'Giao diện đổi ngôn ngữ ngay lập tức và ghi nhớ lựa chọn của bạn.',
    },
    {
      title: 'Riêng tư mặc định',
      body: 'Không tài khoản, không server — ảnh chưa bao giờ rời trình duyệt của bạn.',
    },
  ],

  // ── How it works ──────────────────────────────────────────────────────
  how_eyebrow: 'CÁCH DÙNG',
  how_title: 'Ba bước, một bài đăng.',
  how_steps: [
    {
      title: 'Mở studio',
      body: 'Nhấn "Mở studio" — chạy ngay trong trình duyệt, không cài đặt.',
    },
    {
      title: 'Điền & chỉnh kiểu',
      body: 'Tiêu đề, chi tiết, avatar, mã QR; chọn loại Card, theme và tỉ lệ.',
    },
    {
      title: 'Copy & dán',
      body: 'Copy ảnh rồi Ctrl+V thẳng vào Threads hoặc X, hoặc tải PNG Retina.',
    },
  ],
  how_privacy:
    'Mọi thứ chạy cục bộ trong trình duyệt: không đăng ký, không server, ảnh không bao giờ được tải lên đâu cả.',

  // ── FAQ ───────────────────────────────────────────────────────────────
  faq_eyebrow: 'HỎI ĐÁP',
  faq_title: 'Những điều bạn thắc mắc.',
  faq_items: [
    {
      question: 'Social Card có miễn phí thật không?',
      answer: 'Có. Không có gói trả phí, không giới hạn số lần xuất ảnh, và không cần tài khoản.',
    },
    {
      question: 'Ảnh của tôi có được tải lên server không?',
      answer:
        'Không. Toàn bộ chỉnh sửa và kết xuất ảnh diễn ra trong trình duyệt của bạn — ảnh chỉ rời máy khi chính bạn dán hoặc tải nó lên mạng.',
    },
    {
      question: 'Chất lượng ảnh xuất ra thế nào?',
      answer:
        'Mỗi tỉ lệ xuất PNG Retina 2.5× đúng số pixel chuẩn: 1:1 là 1800 × 1800, 4:5 là 1600 × 2000, 16:9 là 2000 × 1125.',
    },
    {
      question: 'Dùng được trên điện thoại không?',
      answer:
        'Được. Studio có bố cục riêng cho màn hình nhỏ với tấm sheet điều khiển dưới đáy — kéo, chỉnh và xuất ảnh như trên desktop.',
    },
    {
      question: 'Có dùng bằng tiếng Anh không?',
      answer: 'Có — nhấn nút VI/EN trên thanh công cụ; lựa chọn được ghi nhớ cho lần sau.',
    },
  ],

  // ── Final call to action ──────────────────────────────────────────────
  final_title: 'Bài đăng tiếp theo của bạn xứng đáng được đẹp hơn.',
  final_body: 'Mở studio và tạo Card đầu tiên trong dưới một phút.',

  // ── Feedback page (/social-card/feedback) ─────────────────────────────
  feedback_eyebrow: 'GÓP Ý',
  feedback_title: 'Gặp bug? Có ý tưởng?',
  feedback_lede: 'Chọn loại phản hồi, gõ vài dòng, gửi thẳng tới GitHub của dự án.',
  feedback_kind_label: 'Loại phản hồi',
  feedback_kind_bug: 'Bug',
  feedback_kind_feedback: 'Góp ý',
  feedback_kind_idea: 'Ý tưởng',
  feedback_message_label: 'Nội dung',
  feedback_message_placeholder: 'Kể mình nghe điều đã xảy ra, hoặc điều bạn mong muốn…',
  feedback_email_label: 'Email nhận phản hồi (không bắt buộc)',
  feedback_email_placeholder: 'ban@vidu.vn',
  feedback_submit: 'Gửi phản hồi',
  feedback_trust:
    'Gửi sẽ mở một issue GitHub trong tab mới (cần tài khoản GitHub) — email chỉ dùng để phản hồi bạn.',

  // ── Footer ────────────────────────────────────────────────────────────
  footer_story:
    'Social Card là sản phẩm indie của Nam Phạm — xây cho thói quen chia sẻ tiến trình mỗi ngày trên Threads và X. Không quảng cáo, không theo dõi.',
  footer_product_heading: 'Sản phẩm',
  footer_links_heading: 'Liên kết',
  footer_feedback: 'Góp ý',
  footer_credit: 'Một sản phẩm indie của Nam Phạm',
}

const en: typeof vi = {
  nav_features: 'Features',
  nav_cards: 'Card types',
  nav_faq: 'FAQ',
  cta_open_studio: 'Open the studio',

  hero_badge: 'A share-image studio that runs in your browser',
  hero_title_a: 'Beautiful card images,',
  hero_title_b: 'done in one click.',
  hero_lede:
    'Social Card is a one-screen studio for social images: a Quote Card for storytelling, a Showcase Card for your product, a QR call-to-action — exported as a pixel-exact 2.5× Retina PNG you paste straight into Threads or X.',
  hero_trust: 'No account · Nothing to install · Free',
  hero_cta_secondary: 'See the two card types',
  hero_hint: 'free, no sign-up!',
  hero_shot_alt:
    'The Social Card studio on desktop: a glass Inspector on the left, a Showcase card on the dot canvas',

  marquee_items: [
    'Quote Card',
    'Showcase Card',
    'QR call-to-action',
    '4 card themes',
    '3 aspect ratios',
    'Style Presets',
    'Undo & Redo',
    'Vietnamese & English',
    'Dark mode',
  ],

  cards_eyebrow: 'TWO CARD TYPES',
  cards_title: 'Tell a story, or show the product.',
  cards_lede:
    'One studio, two ways to speak: pick the card type in the Inspector and switch any time without losing content.',
  quote_name: 'Quote Card',
  quote_desc:
    'For sayings, opinions, tech notes — big typography with the author and avatar at the card foot.',
  quote_points: [
    'Large headline, optional caps',
    'Multiple detail lines, optional bold',
    'Grayscale avatar for an editorial look',
  ],
  showcase_name: 'Showcase Card',
  showcase_desc:
    'For product screenshots — a hero-plus-details collage of up to 3 shots with handwritten annotations pointing things out.',
  showcase_points: [
    'Hero + details collage, up to 3 shots',
    'Handwritten (Patrick Hand) annotations',
    'Author footer + QR call-to-action',
  ],
  card_quote_alt: 'A Quote Card in the Mist theme with the headline "Làm ít, làm sâu, làm thật."',
  card_showcase_alt: 'A Showcase Card in the Paper theme: a hero shot and the author footer',

  studio_eyebrow: 'ONE SCREEN',
  studio_title: 'Edit and see it instantly. On any screen.',
  studio_body:
    'The whole studio fits one screen: an infinite dot canvas in the middle, a floating Inspector on the left, export right on the toolbar. On phones the Inspector folds into a bottom sheet — drag up to edit, drop to admire the card.',
  studio_points: [
    'Glass Inspector in a single column',
    'Touch sheet for phones',
    'Zoom, Fit-to-View and undo at hand',
  ],
  studio_shot_alt:
    'The Social Card studio on a phone: the card centered on screen, the control sheet collapsed at the bottom',

  ratios_eyebrow: 'PIXEL-EXACT',
  ratios_title: 'Ready for every platform.',
  ratios_lede:
    'Each ratio exports at its platform-exact pixel size — no measuring, no cropping afterwards.',

  grid_eyebrow: 'SMALL, BUT COMPLETE',
  grid_title: 'The other things the studio does well.',
  grid_items: [
    {
      title: 'Four card themes',
      body: 'Ivory paper, pure white, OLED dark, mist — cards always export in their theme, whatever your OS mode.',
    },
    {
      title: 'Style Presets',
      body: 'Classic, Midnight, Minimal, Billboard — one click restyles the whole card.',
    },
    {
      title: 'Hands-on screenshots',
      body: 'Drag to pan, scroll to zoom, double-click to focus on a detail.',
    },
    {
      title: 'QR & call-to-action',
      body: 'Take viewers to your link straight from the image.',
    },
    {
      title: 'Undo & Redo',
      body: 'Every edit is one history step — Ctrl+Z like any editor.',
    },
    {
      title: 'A 30-second tour',
      body: 'The first-run tour points out every part of the studio.',
    },
    {
      title: 'Vietnamese & English',
      body: 'The interface switches instantly and remembers your choice.',
    },
    {
      title: 'Private by default',
      body: 'No account, no server — your images never leave the browser.',
    },
  ],

  how_eyebrow: 'HOW IT WORKS',
  how_title: 'Three steps, one post.',
  how_steps: [
    {
      title: 'Open the studio',
      body: 'Click "Open the studio" — it runs in the browser, nothing to install.',
    },
    {
      title: 'Fill in & style',
      body: 'Headline, details, avatar, QR; pick the card type, theme and ratio.',
    },
    {
      title: 'Copy & paste',
      body: 'Copy the image and Ctrl+V straight into Threads or X, or download the Retina PNG.',
    },
  ],
  how_privacy:
    'Everything runs locally in your browser: no sign-up, no server, and images are never uploaded anywhere.',

  faq_eyebrow: 'FAQ',
  faq_title: 'The things you are wondering.',
  faq_items: [
    {
      question: 'Is Social Card really free?',
      answer: 'Yes. No paid tier, no export limits, and no account.',
    },
    {
      question: 'Are my images uploaded to a server?',
      answer:
        'No. Editing and rendering happen entirely in your browser — an image only leaves your machine when you paste or upload it yourself.',
    },
    {
      question: 'What quality do exports have?',
      answer:
        'Every ratio exports a pixel-exact 2.5× Retina PNG: 1800 × 1800 for 1:1, 1600 × 2000 for 4:5, 2000 × 1125 for 16:9.',
    },
    {
      question: 'Does it work on phones?',
      answer:
        'Yes. The studio has a small-screen layout with a control sheet at the bottom — drag, edit and export just like on desktop.',
    },
    {
      question: 'Can I use it in English?',
      answer: 'Yes — hit the VI/EN button on the toolbar; your choice is remembered for next time.',
    },
  ],

  final_title: 'Your next post deserves to look better.',
  final_body: 'Open the studio and make your first card in under a minute.',

  feedback_eyebrow: 'FEEDBACK',
  feedback_title: 'Found a bug? Got an idea?',
  feedback_lede:
    'Pick a feedback type, type a few lines, and it lands as a GitHub issue on the project repo.',
  feedback_kind_label: 'Feedback type',
  feedback_kind_bug: 'Bug',
  feedback_kind_feedback: 'Feedback',
  feedback_kind_idea: 'Idea',
  feedback_message_label: 'Your feedback',
  feedback_message_placeholder: 'Tell me what happened, or what you wish existed…',
  feedback_email_label: 'Reply email (optional)',
  feedback_email_placeholder: 'you@example.com',
  feedback_submit: 'Send feedback',
  feedback_trust:
    'Sending opens a GitHub issue in a new tab (a GitHub account is needed) — your email is only used to reply to you.',

  footer_story:
    'Social Card is an indie product by Nam Phạm — built for the daily habit of sharing progress on Threads and X. No ads, no tracking.',
  footer_product_heading: 'Product',
  footer_links_heading: 'Links',
  footer_feedback: 'Feedback',
  footer_credit: 'An indie product by Nam Phạm',
}

export const landingDictionaries: Record<Language, typeof vi> = { vi, en }

export type LandingCopy = typeof vi

/** Landing copy in the current Interface Language — the page reuses the
 *  studio's provider (and its persisted VI/EN choice) without touching the
 *  studio's dictionary. */
export function useLandingCopy(): LandingCopy {
  const { language } = useUiCopy()
  return landingDictionaries[language]
}
