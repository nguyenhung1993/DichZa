// ============================================================
// DichZa — Translation Overlay Window
// Cửa sổ nhỏ hiện bản dịch cạnh cursor
// ============================================================

import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { OVERLAY_SIZE } from '../shared/constants'
import { getSettings } from './store'

let isOverlayPinned = false

export function setOverlayPinned(pinned: boolean): void {
  isOverlayPinned = pinned
}

/**
 * Tạo overlay window (transparent, frameless, always-on-top)
 * Window này sẽ hiện bản dịch ngay cạnh cursor
 */
export function createOverlayWindow(): BrowserWindow {
  const settings = getSettings()
  const bgColor = settings.theme === 'light' ? '#f8f9fa' : '#0F1118'

  const overlay = new BrowserWindow({
    width: OVERLAY_SIZE.width,
    height: OVERLAY_SIZE.height,
    show: false,
    frame: false,
    transparent: false, // Must be false when Hardware Acceleration is disabled
    backgroundColor: bgColor, // Dynamic based on theme
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true, // Phải bật true thì Windows mới cho phép dùng lệnh setSize() từ code
    focusable: true, // Allow focus
    hasShadow: true,
    type: 'toolbar', // Không hiện trong Alt+Tab
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Disable CORS
    }
  })

  // Load overlay UI
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlay.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/overlay`)
  } else {
    overlay.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/overlay'
    })
  }

  // Auto-hide khi mất focus (trừ khi đang ghim)
  overlay.on('blur', () => {
    setTimeout(() => {
      if (overlay && !overlay.isDestroyed() && !overlay.isFocused() && !isOverlayPinned) {
        overlay.hide()
      }
    }, 200)
  })

  return overlay
}

/**
 * Hiện overlay tại vị trí cụ thể
 */
export function showOverlay(
  overlay: BrowserWindow,
  x: number,
  y: number,
  width?: number,
  height?: number
): void {
  if (overlay.isDestroyed()) return

  overlay.setPosition(x, y, false)

  if (width && height) {
    overlay.setSize(width, height)
  }

  overlay.showInactive() // Hiện nhưng KHÔNG steal focus
}

/**
 * Ẩn overlay
 */
export function hideOverlay(overlay: BrowserWindow): void {
  if (overlay.isDestroyed()) return
  overlay.hide()
}
