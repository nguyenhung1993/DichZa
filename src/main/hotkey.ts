// ============================================================
// DichZa — Global Hotkey Handler
// Đăng ký hotkeys system-wide, capture selected text
// ============================================================

import { globalShortcut, BrowserWindow, screen } from 'electron'
import { getSettings } from './store'
import { IPC_CHANNELS } from '../shared/types'
import { OVERLAY_OFFSET, OVERLAY_SIZE } from '../shared/constants'
import { startScreenshotMode } from './screenshot'

/**
 * Đăng ký global hotkeys
 */
export function registerHotkeys(
  mainWindow: BrowserWindow,
  overlayWindow: BrowserWindow | null
): void {
  const settings = getSettings()

  // ─────────────────────────────────────────────
  // Hotkey 1: Translate text (Simulate Ctrl+C then translate)
  // ─────────────────────────────────────────────
  try {
    globalShortcut.register(settings.translateHotkey.replace('Ctrl', 'CommandOrControl'), async () => {
      console.log('[DichZa] Translate hotkey triggered')

      try {
        const currentSettings = getSettings()
        const { clipboard } = require('electron')
        const oldText = clipboard.readText()
        
        // Cố gắng dùng VBScript để giả lập phím Ctrl+C trên Windows
        // Điều này giúp user chỉ cần bôi đen -> bấm phím tắt, không cần copy thủ công!
        let newText = oldText
        try {
          const { execSync } = require('child_process')
          const os = require('os')
          const path = require('path')
          const fs = require('fs')
          
          if (process.platform === 'win32') {
            const vbsPath = path.join(os.tmpdir(), 'dichza_copy.vbs')
            // Chờ 50ms (rất nhanh vì F4 không bị kẹt phím Alt/Ctrl)
            const vbsCode = [
              'Set WshShell = WScript.CreateObject("WScript.Shell")',
              'WScript.Sleep 50',
              'WshShell.SendKeys "^c"'
            ].join(os.EOL)
            fs.writeFileSync(vbsPath, vbsCode)
            
            // Chạy async để không block app
            const { exec } = require('child_process')
            await new Promise((resolve) => {
              exec(`wscript.exe //B "${vbsPath}"`, { windowsHide: true }, () => {
                resolve(true)
              })
            })
            
            fs.unlinkSync(vbsPath)
            
            // Đợi thêm 150ms để OS thực sự chép vào clipboard
            await new Promise(resolve => setTimeout(resolve, 150))
            newText = clipboard.readText()
          }
        } catch (e) {
          console.error('[DichZa] Failed to simulate Ctrl+C:', e)
        }

        const selectedText = newText && newText.trim() && newText !== oldText ? newText : oldText

        if (!selectedText || selectedText.trim().length === 0) {
          console.log('[DichZa] No text captured')
          return
        }

        console.log('[DichZa] Captured text:', selectedText.substring(0, 50) + '...')

        // 2. Lấy vị trí cursor hiện tại
        const cursorPoint = screen.getCursorScreenPoint()

        // 3. Tính vị trí overlay
        const display = screen.getDisplayNearestPoint(cursorPoint)
        const { width: screenWidth, height: screenHeight } = display.workAreaSize

        let overlayX = cursorPoint.x + OVERLAY_OFFSET.x
        let overlayY = cursorPoint.y + OVERLAY_OFFSET.y

        // Đảm bảo overlay không ra ngoài màn hình
        if (overlayX + OVERLAY_SIZE.width > display.workArea.x + screenWidth) {
          overlayX = cursorPoint.x - OVERLAY_SIZE.width - OVERLAY_OFFSET.x
        }
        if (overlayY + OVERLAY_SIZE.height > display.workArea.y + screenHeight) {
          overlayY = cursorPoint.y - OVERLAY_SIZE.height - OVERLAY_OFFSET.y
        }

        // 4. Hiện overlay tại vị trí cursor
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.setPosition(overlayX, overlayY, false)
          overlayWindow.setSize(OVERLAY_SIZE.width, OVERLAY_SIZE.height)
          overlayWindow.show()

          // 5. Gửi text đến renderer để dịch
          overlayWindow.webContents.send(IPC_CHANNELS.SELECTED_TEXT, {
            text: selectedText,
            sourceLang: currentSettings.sourceLang,
            targetLang: currentSettings.targetLang,
            provider: currentSettings.defaultProvider
          })
        }
      } catch (error) {
        console.error('[DichZa] Error handling translate hotkey:', error)
      }
    })

    console.log(`[DichZa] Registered translate hotkey: ${settings.translateHotkey}`)
  } catch (error) {
    console.error('[DichZa] Failed to register translate hotkey:', error)
  }

  // ─────────────────────────────────────────────
  // Hotkey 2: Ctrl+Alt+S — Screenshot OCR
  // ─────────────────────────────────────────────
  try {
    globalShortcut.register(settings.ocrHotkey.replace('Ctrl', 'CommandOrControl'), async () => {
      console.log('[DichZa] OCR hotkey triggered')

      // Mở region selector window
      startScreenshotMode()
    })

    console.log(`[DichZa] Registered OCR hotkey: ${settings.ocrHotkey}`)
  } catch (error) {
    console.error('[DichZa] Failed to register OCR hotkey:', error)
  }
}

/**
 * Hủy đăng ký tất cả hotkeys
 */
export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
  console.log('[DichZa] All hotkeys unregistered')
}

/**
 * Re-register hotkeys (khi user thay đổi settings)
 */
export function reregisterHotkeys(
  mainWindow: BrowserWindow,
  overlayWindow: BrowserWindow | null
): void {
  unregisterHotkeys()
  registerHotkeys(mainWindow, overlayWindow)
}
