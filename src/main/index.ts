// ============================================================
// HotLingo — Main Process Entry Point
// Quản lý vòng đời app, tạo windows, đăng ký IPC handlers
// ============================================================

import { app, BrowserWindow, shell, globalShortcut } from 'electron'

// Disable hardware acceleration to prevent GPU process crashes in some environments
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-gpu-rasterization')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('--no-sandbox')
app.commandLine.appendSwitch('disable-dev-shm-usage')

import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createTray, destroyTray } from './tray'
import { registerHotkeys, unregisterHotkeys } from './hotkey'
import { registerIpcHandlers } from './ipc-handlers'
import { initStore, getSettings } from './store'
import { createOverlayWindow } from './overlay'
import { startClipboardMonitor, stopClipboardMonitor } from './clipboard'
import { IPC_CHANNELS } from '../shared/types'
import { OVERLAY_OFFSET, OVERLAY_SIZE } from '../shared/constants'
import { screen } from 'electron'

/** Main app window (tray popup) */
let mainWindow: BrowserWindow
/** Translation overlay window */
let overlayWindow: BrowserWindow | null = null
let regionSelectorWindow: BrowserWindow | null = null

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 520,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    transparent: false, // Fix invisibility issue with GPU disabled
    backgroundColor: '#1E1E2E', // Solid background for settings panel
    alwaysOnTop: true,
    icon: is.dev ? join(__dirname, '../../resources/icon.png') : join(process.resourcesPath, 'resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Disable CORS cho phép fetch APIs (Google, OpenAI) từ renderer
    }
  })

  // Ẩn khi click ngoài
  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide()
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Không show ngay — sẽ show khi click tray icon
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ============================================================
// App Lifecycle
// ============================================================

app.whenReady().then(() => {
  // Đặt app user model id cho Windows
  electronApp.setAppUserModelId('com.dichza.app')

  // Init persistent store
  initStore()

  // Tạo windows
  const win = createMainWindow()
  overlayWindow = createOverlayWindow()

  // Tạo system tray
  createTray(win)

  // Đăng ký global hotkeys
  registerHotkeys(win, overlayWindow)

  // Đăng ký IPC handlers
  registerIpcHandlers(win, overlayWindow)

  // Dev tools shortcut
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
})

// Không quit khi đóng tất cả window (tray app)
app.on('window-all-closed', () => {
  // Không gọi app.quit() — giữ app chạy trong tray
})

app.on('will-quit', () => {
  stopClipboardMonitor()
  if (app.isReady()) {
    unregisterHotkeys()
    globalShortcut.unregisterAll()
  }
  destroyTray()
})

// Ngăn chạy nhiều instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export { mainWindow, overlayWindow }
