// ============================================================
// DichZa — Shared Constants
// ============================================================

/** Tên app */
export const APP_NAME = 'DichZa'

/** Max history items */
export const MAX_HISTORY_ITEMS = 50

/** Clipboard read delay (ms) */
export const CLIPBOARD_READ_DELAY = 600

/** Overlay offset from cursor */
export const OVERLAY_OFFSET = { x: 12, y: 12 }

/** Overlay dimensions */
export const OVERLAY_SIZE = { width: 420, height: 280 }

/** Tray popup dimensions */
export const TRAY_POPUP_SIZE = { width: 380, height: 520 }

/** Supported languages */
export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Tự động', nameEn: 'Auto Detect' },
  { code: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese' },
  { code: 'en', name: 'Tiếng Anh', nameEn: 'English' },
  { code: 'ja', name: 'Tiếng Nhật', nameEn: 'Japanese' },
  { code: 'ko', name: 'Tiếng Hàn', nameEn: 'Korean' },
  { code: 'zh-CN', name: 'Tiếng Trung (Giản thể)', nameEn: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Tiếng Trung (Phồn thể)', nameEn: 'Chinese (Traditional)' },
  { code: 'fr', name: 'Tiếng Pháp', nameEn: 'French' },
  { code: 'de', name: 'Tiếng Đức', nameEn: 'German' },
  { code: 'es', name: 'Tiếng Tây Ban Nha', nameEn: 'Spanish' },
  { code: 'th', name: 'Tiếng Thái', nameEn: 'Thai' },
  { code: 'ru', name: 'Tiếng Nga', nameEn: 'Russian' },
  { code: 'pt', name: 'Tiếng Bồ Đào Nha', nameEn: 'Portuguese' },
  { code: 'it', name: 'Tiếng Ý', nameEn: 'Italian' },
  { code: 'ar', name: 'Tiếng Ả Rập', nameEn: 'Arabic' },
  { code: 'hi', name: 'Tiếng Hindi', nameEn: 'Hindi' }
] as const
