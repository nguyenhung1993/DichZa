import { BrowserWindow, screen, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let screenshotWindows: BrowserWindow[] = []

export function startScreenshotMode(): void {
  closeScreenshotMode()

  const displays = screen.getAllDisplays()

  displays.forEach(display => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      enableLargerThanScreen: true, // Giúp window phủ qua được Taskbar
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    // To prevent user from clicking through the window
    win.setIgnoreMouseEvents(false)

    win.on('closed', () => {
      screenshotWindows = screenshotWindows.filter(w => w !== win)
    })

    win.on('ready-to-show', () => {
      win.setAlwaysOnTop(true, 'screen-saver', 1)
      win.show()
    })

    const hash = `#/ocr?displayId=${display.id}`
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${hash}`)
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/ocr?displayId=${display.id}` })
    }

    screenshotWindows.push(win)
  })
}

export function closeScreenshotMode(): void {
  screenshotWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.close()
    }
  })
  screenshotWindows = []
}
