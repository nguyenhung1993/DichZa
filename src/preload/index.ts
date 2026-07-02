// ============================================================
// DichZa — Preload Script
// contextBridge: expose API an toàn từ Main → Renderer
// ============================================================

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, AppSettings, TranslationResult } from '../shared/types'

/** API exposed to renderer via window.dichza */
const api = {
  // ─────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  setSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, settings),

  // ─────────────────────────────────────────────
  // History
  // ─────────────────────────────────────────────
  getHistory: (): Promise<TranslationResult[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_HISTORY),

  addHistory: (item: TranslationResult): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.ADD_HISTORY, item),

  clearHistory: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),

  // ─────────────────────────────────────────────
  // Clipboard
  // ─────────────────────────────────────────────
  copyToClipboard: (text: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.COPY_TO_CLIPBOARD, text),

  // ─────────────────────────────────────────────
  // Window Control
  // ─────────────────────────────────────────────
  hideOverlay: (): void =>
    ipcRenderer.send(IPC_CHANNELS.HIDE_OVERLAY),

  setPinned: (pinned: boolean): void =>
    ipcRenderer.send(IPC_CHANNELS.SET_PINNED, pinned),

  resizeOverlay: (width: number, height: number): void =>
    ipcRenderer.send(IPC_CHANNELS.OVERLAY_RESIZE, { width, height }),

  showTrayPopup: (): void =>
    ipcRenderer.send(IPC_CHANNELS.SHOW_TRAY_POPUP),

  hideTrayPopup: (): void =>
    ipcRenderer.send(IPC_CHANNELS.HIDE_TRAY_POPUP),

  quitApp: (): void =>
    ipcRenderer.send(IPC_CHANNELS.QUIT_APP),

  installUpdate: (): void =>
    ipcRenderer.send(IPC_CHANNELS.INSTALL_UPDATE),

  // ─────────────────────────────────────────────
  // OCR
  // ─────────────────────────────────────────────
  getDesktopSources: (): Promise<{id: string, name: string, display_id: string}[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DESKTOP_SOURCES),

  closeOcrWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.CLOSE_OCR_WINDOW),
    
  sendOcrResult: (text: string): void => {
    ipcRenderer.send(IPC_CHANNELS.OCR_RESULT, text)
  },

  // ─────────────────────────────────────────────
  // Services (Main process)
  // ─────────────────────────────────────────────
  translateGoogle: (text: string, from: string, to: string): Promise<{ text: string; detectedLang?: string }> =>
    ipcRenderer.invoke('google:translate', text, from, to),

  // ─────────────────────────────────────────────
  // Event Listeners (Main → Renderer)
  // ─────────────────────────────────────────────

  /** Lắng nghe khi có text được chọn (từ hotkey) */
  onSelectedText: (callback: (data: {
    text: string
    sourceLang: string
    targetLang: string
    provider: string
  }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.SELECTED_TEXT, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SELECTED_TEXT, handler)
  },

  /** Lắng nghe khi có translation streaming */
  onTranslationStream: (callback: (data: {
    token: string
    done: boolean
  }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.TRANSLATION_STREAM, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TRANSLATION_STREAM, handler)
  },

  /** Lắng nghe navigation events */
  onNavigate: (callback: (page: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, page: string) => callback(page)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },

  /** Lắng nghe thay đổi settings từ window khác */
  onSettingsChanged: (callback: (settings: AppSettings) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, settings: AppSettings) => callback(settings)
    ipcRenderer.on('settings:changed', handler)
    return () => ipcRenderer.removeListener('settings:changed', handler)
  },

  /** Lắng nghe OCR request */
  onOcrRequest: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC_CHANNELS.REQUEST_OCR, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.REQUEST_OCR, handler)
  },

  /** Lắng nghe khi tải xong bản cập nhật */
  onUpdateDownloaded: (callback: (version: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, version: string) => callback(version)
    ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_DOWNLOADED, handler)
  }
}

// Expose API to renderer
contextBridge.exposeInMainWorld('dichza', api)

// Type declaration for renderer
export type DichZaAPI = typeof api
