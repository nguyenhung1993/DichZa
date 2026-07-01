// ============================================================
// HotLingo — System Tray
// Tạo tray icon, context menu, toggle popup window
// ============================================================

import { Tray, Menu, BrowserWindow, nativeImage, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let tray: Tray | null = null

/**
 * Tạo System Tray với icon và context menu
 */
export function createTray(mainWindow: BrowserWindow): void {
  // Load tray icon
  const iconPath = is.dev
    ? join(__dirname, '../../resources/icon.png')
    : join(process.resourcesPath, 'resources/icon.png')

  let trayIcon: Electron.NativeImage
  try {
    const fs = require('fs')
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath)
      trayIcon = trayIcon.resize({ width: 16, height: 16 })
    } else {
      throw new Error('Icon not found')
    }
  } catch {
    // Fallback: một ô vuông đỏ nhỏ xíu để user vẫn thấy được trên tray
    const fallbackBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAcSURBVDhPY3zP4P8fwwyUDBs1YNSAUQNGDRgqGADO5i+3jY7fNgAAAABJRU5ErkJggg=='
    trayIcon = nativeImage.createFromDataURL(fallbackBase64)
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('DichZa — Dịch tức thì')

  // Context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🌐 Hiển thị DichZa',
      click: () => toggleMainWindow(mainWindow)
    },
    { type: 'separator' },
    {
      label: '⚙️ Cài đặt',
      click: () => {
        showMainWindow(mainWindow)
        mainWindow.webContents.send('navigate', 'settings')
      }
    },
    {
      label: '📋 Lịch sử dịch',
      click: () => {
        showMainWindow(mainWindow)
        mainWindow.webContents.send('navigate', 'history')
      }
    },
    { type: 'separator' },
    {
      label: '🔑 Phím tắt: Ctrl+Alt+T (Dịch)',
      enabled: false
    },
    {
      label: '📸 Phím tắt: Ctrl+Alt+S (OCR)',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '❌ Thoát',
      click: () => {
        const { app } = require('electron')
        app.quit()
      }
    }
  ])

  // Click trái: toggle popup
  tray.on('click', () => {
    toggleMainWindow(mainWindow)
  })

  // Click phải: context menu
  tray.setContextMenu(contextMenu)
}

/**
 * Toggle main window — hiện/ẩn popup cạnh tray icon
 */
function toggleMainWindow(mainWindow: BrowserWindow): void {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showMainWindow(mainWindow)
  }
}

/**
 * Hiện main window tại vị trí gần tray icon
 */
function showMainWindow(mainWindow: BrowserWindow): void {
  // Lấy bounds của tray icon
  const trayBounds = tray?.getBounds()

  if (trayBounds) {
    const display = screen.getDisplayNearestPoint({
      x: trayBounds.x,
      y: trayBounds.y
    })
    const { width: screenWidth, height: screenHeight } = display.workAreaSize
    const windowBounds = mainWindow.getBounds()

    // Tính vị trí: canh giữa tray icon, phía trên taskbar
    let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
    let y = Math.round(trayBounds.y - windowBounds.height - 8)

    // Đảm bảo không ra ngoài màn hình
    x = Math.max(display.workArea.x, Math.min(x, display.workArea.x + screenWidth - windowBounds.width))
    y = Math.max(display.workArea.y, Math.min(y, display.workArea.y + screenHeight - windowBounds.height))

    mainWindow.setPosition(x, y, false)
  }

  mainWindow.show()
  mainWindow.focus()
}

/**
 * Destroy tray khi app quit
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
