// ============================================================
// DichZa — Shared Types
// Dùng chung giữa Main, Preload và Renderer processes
// ============================================================

/** Ngôn ngữ được hỗ trợ */
export type LanguageCode = 'vi' | 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW' | 'fr' | 'de' | 'es' | 'th' | 'auto'

/** Nhà cung cấp dịch thuật */
export type TranslationProvider = 'google' | 'openai' | 'gemini' | 'dichza'

/** Kết quả dịch */
export interface TranslationResult {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: LanguageCode
  targetLang: LanguageCode
  provider: TranslationProvider
  timestamp: number
  /** Thời gian dịch (ms) */
  duration: number
  /** Từ OCR hay text selection */
  source: 'selection' | 'ocr'
}

/** Smart Context - 3 lớp */
export interface SmartContext {
  /** Layer 1: Persistent - áp dụng cho mọi bản dịch AI */
  persistent: PersistentContext
  /** Layer 2: Per-message - context tạm thời */
  perMessage: string
  /** Layer 3: Per-screenshot - context cho OCR */
  perScreenshot: string
}

export interface PersistentContext {
  role: string
  domain: string
  tone: 'professional' | 'casual' | 'formal' | 'friendly'
  glossary: Record<string, string>
  autoDetect?: boolean
}

/** Cài đặt app */
export interface AppSettings {
  /** Hotkey dịch text */
  translateHotkey: string
  /** Hotkey OCR */
  ocrHotkey: string
  /** Ngôn ngữ nguồn */
  sourceLang: LanguageCode
  /** Ngôn ngữ đích */
  targetLang: LanguageCode
  /** Provider mặc định */
  defaultProvider: TranslationProvider
  /** Ngôn ngữ UI */
  uiLanguage: 'vi' | 'en'
  /** Theme */
  theme: 'dark' | 'light'
  /** Auto-hide overlay sau bao lâu (ms) */
  overlayAutoHideMs: number
  /** Auto-start with Windows */
  autoStartWithWindows: boolean
  /** OpenAI API key (nếu dùng trực tiếp) */
  openaiApiKey?: string
  /** OpenAI model */
  openaiModel: string
  /** Gemini API key */
  geminiApiKey?: string
  /** Gemini model */
  geminiModel: string
  /** Smart Context */
  smartContext: SmartContext
}

/** Default settings */
export const DEFAULT_SETTINGS: AppSettings = {
  translateHotkey: 'F4',
  ocrHotkey: 'F3',
  autoStartWithWindows: true,
  sourceLang: 'auto',
  targetLang: 'vi',
  defaultProvider: 'google',
  uiLanguage: 'vi',
  theme: 'dark',
  overlayAutoHideMs: 10000,
  openaiModel: 'gpt-4o-mini',
  geminiModel: 'gemini-2.0-flash',
  smartContext: {
    persistent: {
      role: 'Bạn là một phiên dịch chuyên nghiệp',
      domain: 'general',
      tone: 'professional',
      glossary: {},
      autoDetect: true
    },
    perMessage: '',
    perScreenshot: ''
  }
}

/** IPC Channel names */
export const IPC_CHANNELS = {
  // Main → Renderer
  TRANSLATION_START: 'translation:start',
  TRANSLATION_STREAM: 'translation:stream',
  TRANSLATION_COMPLETE: 'translation:complete',
  TRANSLATION_ERROR: 'translation:error',
  SELECTED_TEXT: 'selected-text',
  OCR_RESULT: 'ocr:result',
  SHOW_OVERLAY: 'overlay:show',
  HIDE_OVERLAY: 'overlay:hide',
  OVERLAY_RESIZE: 'overlay:resize',
  SET_PINNED: 'overlay:set-pinned',
  UPDATE_DOWNLOADED: 'update:downloaded',

  // Renderer → Main
  REQUEST_TRANSLATE: 'translate:request',
  REQUEST_OCR: 'ocr:request',
  COPY_TO_CLIPBOARD: 'clipboard:copy',
  GET_SETTINGS: 'settings:get',
  SET_SETTINGS: 'settings:set',
  GET_HISTORY: 'history:get',
  ADD_HISTORY: 'history:add',
  CLEAR_HISTORY: 'history:clear',
  SHOW_TRAY_POPUP: 'tray:show',
  HIDE_TRAY_POPUP: 'tray:hide',
  QUIT_APP: 'app:quit',
  GET_DESKTOP_SOURCES: 'desktop:sources',
  CLOSE_OCR_WINDOW: 'ocr:close',
  INSTALL_UPDATE: 'update:install'
} as const
