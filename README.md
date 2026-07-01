# DichZa — Dịch Tức Thì 🌐

DichZa là một ứng dụng dịch thuật thông minh và tiện lợi dành cho máy tính (Desktop), giúp bạn dịch bất kỳ đoạn văn bản nào ở bất kỳ đâu chỉ trong chớp mắt mà không cần phải chuyển đổi qua lại giữa các tab hay copy-paste rườm rà.

---

## ✨ Tính năng nổi bật

- **⚡ Dịch siêu tốc (Popup ngay tại trỏ chuột):** Bạn chỉ cần bôi đen văn bản ở trình duyệt, Word, Excel, PDF, hay bất kỳ phần mềm nào → Bấm phím tắt (`F4`) → Bản dịch sẽ hiện ra ngay lập tức bên cạnh con trỏ chuột.
- **📸 Dịch bằng hình ảnh (OCR Screenshot):** Bạn gặp văn bản không thể bôi đen (ví dụ: chữ trong ảnh, trên video hoặc trong game)? Chỉ cần bấm phím tắt (`F3`) → Kéo chọn vùng cần dịch trên màn hình → Có ngay bản dịch! Đặc biệt: Hỗ trợ hoàn hảo cho **hệ thống đa màn hình (Multi-monitors)**.
- **🧠 Hỗ trợ Dịch AI (Smart Context):** Khả năng tùy biến thêm Context (Ngữ cảnh) để AI dịch sát nghĩa chuyên ngành hoặc giữ đúng văn phong lịch sự/thân mật.
- **🛡 Hoạt động ngầm thông minh:** Ứng dụng chạy mượt mà dưới khay hệ thống (System Tray), hoàn toàn không chiếm diện tích màn hình hay cản trở công việc của bạn.

---

## 🚀 Công nghệ sử dụng

- **Core/Desktop:** Electron, Electron-Vite (tối ưu hóa tốc độ build)
- **Giao diện (UI):** React 19, TypeScript, CSS (Glassmorphism, Animations)
- **Quản lý trạng thái:** Zustand
- **Dịch thuật & AI:** Google Translate (Free unlimited), OpenAI API
- **Xử lý ảnh (OCR):** Tesseract.js (Chạy đa luồng không giật lag)
- **Đóng gói:** Electron Builder (Hỗ trợ sinh file cài đặt `.exe`)

---

## 🛠 Hướng dẫn Cài đặt & Phát triển

### 1. Yêu cầu hệ thống
- Môi trường chạy: [Node.js](https://nodejs.org/) (khuyên dùng bản LTS từ 18+ trở lên).
- Hệ điều hành: Hỗ trợ tốt nhất trên Windows.

### 2. Cài đặt mã nguồn
```bash
# Clone source code về máy
git clone https://github.com/nguyenhung1993/DichZa.git
cd DichZa

# Cài đặt các thư viện phụ thuộc
npm install
```

### 3. Chạy chế độ phát triển (Dev Mode)
```bash
npm run dev
```

### 4. Đóng gói ra file cài đặt (.exe)
Để xuất phần mềm ra file cài đặt và chia sẻ cho người khác, bạn chỉ cần chạy lần lượt 2 lệnh sau:

```bash
# 1. Biên dịch code
npm run build

# 2. Đóng gói
npm run dist
```
Sau khi quá trình đóng gói hoàn tất, file cài đặt sẽ nằm sẵn trong thư mục `dist/DichZa-Setup-1.0.0.exe`.

---

## 📸 Hình ảnh giao diện
*(Tại đây bạn có thể tự chụp vài bức ảnh màn hình giao diện app lúc đang dùng và upload lên GitHub, sau đó chèn link ảnh vào đây nhé!)*

---
**Phát triển bởi [nguyenhung1993](https://github.com/nguyenhung1993)** — *Biến mọi rào cản ngôn ngữ trên Desktop trở thành con số không.*
