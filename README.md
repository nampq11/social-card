# Social Card — Minimalist Card Studio

Công cụ tạo ảnh bài viết tối giản chuẩn tỉ lệ cho **Threads, X (Twitter) & Facebook**, được thiết kế theo phong cách **Apple Design** và tối ưu cho avatar nét sáp cá nhân của Nam Pham.

![Social Card Preview](/avatar.png)

## 🚀 Tính năng nổi bật

- **Khớp 100% phong cách ảnh mẫu**: Card tối giản, typography phân cấp rõ nét (Be Vietnam Pro), khoảng thở rộng rãi.
- **Apple Design Interface**: Giao diện macOS Studio với kính mờ (_Translucent Frosted Glass_), tương tác tactile `:active` nhạy bén, các nút chuyển tỉ lệ _Segmented Control_ kiểu iOS.
- **Đa tỉ lệ mạng xã hội**:
  - `1:1 Square` (2048 × 2048 px) cho Threads, X, Instagram.
  - `4:5 Portrait` (1080 × 1350 px) tối ưu diện tích hiển thị trên mobile feed.
  - `16:9 Landscape` (1920 × 1080 px) cho X card link & Facebook desktop.
- **3 Theme màu linh hoạt**:
  - `Giấy ngà (Paper)`: Ấm áp, tôn trọn nét vẽ sáp màu của avatar.
  - `Trắng tinh (White)`: Tối giản, thanh lịch như ảnh mẫu gốc.
  - `Tối OLED (Dark)`: Tương phản cao, phong cách công nghệ.
- **Copy 1-Click vào Clipboard**: Tự động render PNG chuẩn Retina (2.5x) vào bộ nhớ tạm. Bạn chỉ cần ấn `Ctrl + V` dán trực tiếp vào Threads/X/Facebook mà không cần tải và xóa file ảnh rác trên máy.
- **Tùy chỉnh QR Code động**: Tự động sinh mã QR dẫn về GitHub / Website / Profile cá nhân kèm lời kêu gọi (CTA).

---

## 🛠 Phát triển & Chạy Local

```bash
# Cài đặt thư viện
pnpm install

# Khởi chạy server dev (Vite)
pnpm dev
```

Mở trình duyệt tại: `http://localhost:5173`

---

## 🚀 Hướng dẫn Deploy lên Vercel

Dự án đã có sẵn file cấu hình `vercel.json` tối ưu cho Vite Single Page Application.

### Cách 1: Deploy qua GitHub (Khuyên dùng)

1. Tạo repo mới trên GitHub (ví dụ: `social-card`).
2. Đẩy code lên:
   ```bash
   git remote add origin git@github.com:nampq/social-card.git
   git branch -M main
   git push -u origin main
   ```
3. Truy cập [vercel.com/new](https://vercel.com/new), chọn repository và bấm **Deploy**.

### Cách 2: Deploy trực tiếp bằng Vercel CLI

```bash
# Đăng nhập và deploy production
npx vercel --prod
```
