// ============================================================
// DichZa — IPC Handlers
// Xử lý communication giữa Main ↔ Renderer processes
// ============================================================

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import { getSettings, setSettings, getHistory, addHistory, clearHistory } from './store'
import { copyToClipboard } from './clipboard'
import { hideOverlay, setOverlayPinned } from './overlay'
import { reregisterHotkeys } from './hotkey'
import { closeScreenshotMode } from './screenshot'
import { installUpdate } from './auto-updater'
import { OVERLAY_OFFSET, OVERLAY_SIZE } from '../shared/constants'

/**
 * Đăng ký tất cả IPC handlers
 */
export function registerIpcHandlers(
  mainWindow: BrowserWindow,
  overlayWindow: BrowserWindow | null
): void {
  ipcMain.on(IPC_CHANNELS.SET_PINNED, (_event, pinned: boolean) => {
    setOverlayPinned(pinned)
  })

  // ─────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, (_event, settings) => {
    const updated = setSettings(settings)
    const { app } = require('electron')

    if (app.isPackaged && typeof settings.autoStartWithWindows !== 'undefined') {
      app.setLoginItemSettings({
        openAtLogin: updated.autoStartWithWindows,
        path: app.getPath('exe'),
        args: ['--hidden']
      })
    }

    // Re-register hotkeys nếu đổi phím tắt
    if (settings.translateHotkey || settings.ocrHotkey) {
      reregisterHotkeys(mainWindow, overlayWindow)
    }

    return updated
  })

  // ─────────────────────────────────────────────
  // History
  // ─────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, () => {
    return getHistory()
  })

  ipcMain.handle(IPC_CHANNELS.ADD_HISTORY, (_event, item) => {
    addHistory(item)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () => {
    clearHistory()
    return true
  })

  // ─────────────────────────────────────────────
  // Clipboard
  // ─────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.COPY_TO_CLIPBOARD, (_event, text: string) => {
    copyToClipboard(text)
    return true
  })

  // ─────────────────────────────────────────────
  // Overlay
  // ─────────────────────────────────────────────

  ipcMain.on(IPC_CHANNELS.HIDE_OVERLAY, () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      hideOverlay(overlayWindow)
    }
  })

  ipcMain.on(IPC_CHANNELS.OVERLAY_RESIZE, (_event, { width, height }) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      const bounds = overlayWindow.getBounds()
      const { screen } = require('electron')
      const display = screen.getDisplayMatching(bounds)

      let newWidth = Math.ceil(width)
      let newHeight = Math.ceil(height)
      let newX = bounds.x
      let newY = bounds.y

      // Adjust Y so it doesn't go off the bottom of the screen
      if (newY + newHeight > display.workArea.y + display.workArea.height) {
        newY = display.workArea.y + display.workArea.height - newHeight
        // Don't push it above the top edge
        if (newY < display.workArea.y) newY = display.workArea.y
      }

      // Adjust X so it doesn't go off the right edge
      if (newX + newWidth > display.workArea.x + display.workArea.width) {
        newX = display.workArea.x + display.workArea.width - newWidth
        if (newX < display.workArea.x) newX = display.workArea.x
      }

      overlayWindow.setBounds({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })
    }
  })

  // ─────────────────────────────────────────────
  // Tray Popup
  // ─────────────────────────────────────────────

  ipcMain.on(IPC_CHANNELS.SHOW_TRAY_POPUP, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  ipcMain.on(IPC_CHANNELS.HIDE_TRAY_POPUP, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide()
    }
  })

  // ─────────────────────────────────────────────
  // App control
  // ─────────────────────────────────────────────

  ipcMain.on(IPC_CHANNELS.QUIT_APP, () => {
    const { app } = require('electron')
    app.quit()
  })

  ipcMain.on(IPC_CHANNELS.INSTALL_UPDATE, () => {
    installUpdate()
  })

  // ─────────────────────────────────────────────
  // OCR
  // ─────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.GET_DESKTOP_SOURCES, async () => {
    const { desktopCapturer } = require('electron')
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    return sources.map(s => ({ id: s.id, name: s.name, display_id: s.display_id }))
  })

  ipcMain.on(IPC_CHANNELS.CLOSE_OCR_WINDOW, () => {
    closeScreenshotMode()
  })

  ipcMain.on(IPC_CHANNELS.OCR_RESULT, (_event, text: string) => {
    console.log('[DichZa] OCR Result:', text.substring(0, 50) + '...')
    const { screen } = require('electron')

    // Đóng region selector
    closeScreenshotMode()

    if (!overlayWindow || overlayWindow.isDestroyed()) return

    // 2. Lấy vị trí cursor hiện tại
    const cursorPoint = screen.getCursorScreenPoint()

    // 3. Tính vị trí overlay
    const display = screen.getDisplayNearestPoint(cursorPoint)
    const { width: screenWidth, height: screenHeight } = display.workAreaSize

    let overlayX = cursorPoint.x + OVERLAY_OFFSET.x
    let overlayY = cursorPoint.y + OVERLAY_OFFSET.y

    if (overlayX + OVERLAY_SIZE.width > display.workArea.x + screenWidth) {
      overlayX = cursorPoint.x - OVERLAY_SIZE.width - OVERLAY_OFFSET.x
    }
    if (overlayY + OVERLAY_SIZE.height > display.workArea.y + screenHeight) {
      overlayY = cursorPoint.y - OVERLAY_SIZE.height - OVERLAY_OFFSET.y
    }

    // 4. Hiện overlay tại vị trí cursor
    overlayWindow.setPosition(overlayX, overlayY, false)
    overlayWindow.setSize(OVERLAY_SIZE.width, OVERLAY_SIZE.height)
    overlayWindow.show()

    // 5. Gửi text đến renderer để dịch
    const settings = getSettings()
    overlayWindow.webContents.send(IPC_CHANNELS.SELECTED_TEXT, {
      text: text,
      sourceLang: settings.sourceLang,
      targetLang: settings.targetLang,
      provider: settings.defaultProvider
    })
  })
  // ─────────────────────────────────────────────
  // Translation (Main Process)
  // ─────────────────────────────────────────────

  ipcMain.handle('google:translate', async (_event, text: string, from: string, to: string) => {
    try {
      const { translate } = require('google-translate-api-x')
      const safeFrom = (!from || from === 'auto' || from === 'undefined') ? 'auto' : from
      
      // Giới hạn độ dài văn bản để tránh lỗi từ API (VD: Ctrl+A toàn bộ trang web)
      const MAX_LENGTH = 3000
      let textToTranslate = text
      if (text.length > MAX_LENGTH) {
        textToTranslate = text.substring(0, MAX_LENGTH) + '\n\n... (Văn bản quá dài, phần sau đã bị cắt bớt)'
      }

      const result = await translate(textToTranslate, {
        from: safeFrom,
        to: to,
        autoCorrect: true,
        forceFrom: true,
        forceBatch: false,
        rejectOnPartialFail: false
      } as any)

      return {
        text: Array.isArray(result) ? result.map(r => r.text).join(' ') : result.text,
        detectedLang: Array.isArray(result) ? result[0]?.from?.language?.iso : result.from?.language?.iso
      }
    } catch (error: any) {
      console.error('[DichZa Main] Google Translate error:', error.message)
      if (error.message?.includes('403') || error.message?.includes('429')) {
        throw new Error('Google Translate đang bị rate limit. Vui lòng thử lại sau.')
      }
      throw new Error(`Google Translate lỗi: ${error.message}`)
    }
  })
}
