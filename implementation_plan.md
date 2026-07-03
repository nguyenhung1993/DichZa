# Đánh giá và Kế hoạch Nâng cấp Hệ thống DichZa

Tài liệu này đánh giá tổng quan về kiến trúc, chức năng của ứng dụng DichZa hiện tại, phân tích các ưu/nhược điểm và đề xuất lộ trình nâng cấp chi tiết.

## 1. Đánh giá Tổng quan Hệ thống (System Overview)

DichZa là một ứng dụng dịch thuật trên Desktop (Windows) hoạt động ngầm dưới System Tray, cho phép người dùng dịch văn bản nhanh chóng thông qua phím tắt (Hotkey) mà không cần chuyển đổi ứng dụng.

**Ngăn xếp công nghệ (Tech Stack):**
- **Core:** Electron (Node.js) cho Desktop App.
- **Frontend:** React 19, TypeScript, Vite.
- **State Management:** Zustand.
- **Các thư viện chính:** `tesseract.js` (OCR), `google-translate-api-x` (Dịch thuật), `electron-store` (Lưu trữ).

**Kiến trúc:**
Hệ thống tuân thủ mô hình chuẩn của Electron:
- **Main Process:** Quản lý vòng đời ứng dụng, phím tắt toàn cục (global hotkeys), thao tác clipboard, và giao tiếp với các API bên ngoài.
- **Preload Scripts:** Cầu nối bảo mật (Context Bridge) giữa Main và Renderer.
- **Renderer Process:** Chứa UI (Tray Popup, Overlay hiển thị bản dịch, và giao diện chọn vùng OCR).

## 2. Phân tích Ưu & Nhược điểm

### Ưu điểm (Pros)
1. **Trải nghiệm người dùng (UX) liền mạch:** Việc sử dụng phím tắt (F3, F4) và hiển thị bản dịch ngay tại vị trí con trỏ chuột (Overlay Window) giúp người dùng không bị gián đoạn luồng công việc.
2. **Hỗ trợ đa phương thức nhập:** Hỗ trợ cả dịch văn bản thuần (quét khối + Copy) và dịch qua hình ảnh (OCR), bao phủ hầu hết các tình huống sử dụng.
3. **Tích hợp AI linh hoạt:** Hỗ trợ cả Google Translate truyền thống và OpenAI, đồng thời xử lý tốt việc stream từng từ (streaming response) từ AI để tạo cảm giác phản hồi tức thì.
4. **Kiến trúc Frontend hiện đại:** Sử dụng React + Vite + Zustand giúp ứng dụng chạy mượt mà, dễ bảo trì và mở rộng giao diện.

### Nhược điểm (Cons)
1. **Rủi ro về API Dịch thuật:** Việc sử dụng `google-translate-api-x` (bản chất là cào dữ liệu/scraping) rất dễ bị Google chặn IP (lỗi 429 Too Many Requests) nếu người dùng dịch quá nhiều trong thời gian ngắn.
2. **Hiệu năng OCR:** `tesseract.js` chạy bằng WebAssembly trong Renderer process. Tốc độ nhận diện có thể chậm và tiêu tốn nhiều CPU/RAM đối với ảnh lớn hoặc cấu hình máy yếu, đồng thời khả năng nhận diện tiếng Việt đôi khi chưa hoàn hảo bằng các API OCR chuyên dụng (như Google Vision hay Windows Native OCR).
3. **Quản lý dữ liệu:** Lịch sử dịch đang được lưu bằng `electron-store`. Nếu lịch sử quá lớn, việc đọc/ghi đồng bộ (synchronous) có thể gây giật lag (block main thread).
4. **Giới hạn Context AI:** Tính năng Smart Context hiện tại chưa thực sự "thông minh" tự động (ví dụ: chưa tự nhận diện đang ở màn hình code hay màn hình chat để đổi prompt tương ứng).

---

## 3. Lộ trình Nâng cấp (Upgrade Plan)

Dưới đây là kế hoạch nâng cấp chia theo từng giai đoạn ưu tiên.

### Giai đoạn 1: Ổn định Hệ thống & Hiệu năng (Core & Performance)
- **Tối ưu hóa OCR:** 
  - Đưa quá trình xử lý OCR từ Renderer xuống Main process (dùng Web Worker hoặc Node worker threads) để không làm đơ giao diện.
  - Tích hợp thêm tùy chọn Windows Native OCR (nhanh và nhẹ hơn rất nhiều trên Windows 10/11) thay thế cho Tesseract khi có thể.
- **Khắc phục lỗi Rate Limit API:** Cấu hình tự động chuyển đổi proxy hoặc fallback sang các thư viện dịch khác khi Google Translate báo lỗi 429.
- **Nâng cấp Storage:** Chuyển đổi lịch sử lưu trữ từ `electron-store` sang cơ sở dữ liệu bất đồng bộ (như SQLite hoặc IndexedDB) kết hợp phân trang (pagination) để UI tải nhanh hơn.

### Giai đoạn 2: Tính năng Nâng cao (Advanced Features)
- **Mở rộng Provider AI:** Tích hợp thêm các mô hình ngôn ngữ lớn khác như Claude, Gemini, DeepSeek (đặc biệt các model giá rẻ hoặc miễn phí).
- **Dịch Offline:** Nghiên cứu tích hợp mô hình dịch cục bộ (Local LLM qua ONNX hoặc llama.cpp) để ứng dụng có thể hoạt động mà không cần kết nối mạng.
- **Tự động nhận diện ngữ cảnh (Auto Smart Context):** 
  - Đọc tên tiến trình (process) đang chạy (vd: `devenv.exe`, `Code.exe`) để tự động gắn prompt phù hợp. Ví dụ: Đang mở VS Code -> Dịch với tư duy lập trình viên.

### Giai đoạn 3: Trải nghiệm người dùng & Tùy biến (UX/UI & Customization)
- **Giao diện cài đặt nâng cao:** Cho phép người dùng tùy chỉnh màu sắc chi tiết, font chữ, độ trong suốt của Overlay.
- **Tự định nghĩa phím tắt:** Xây dựng giao diện cho phép người dùng tự thu và gán phím tắt linh hoạt hơn (tránh xung đột phím với các app khác).
- **Quản lý Lịch sử thông minh:** Thêm tính năng xuất/nhập (export/import) lịch sử, đánh dấu mục yêu thích (favorites), và tạo các bộ thẻ học từ vựng (flashcard).
