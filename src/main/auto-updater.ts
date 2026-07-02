import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../shared/types'

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  // Chế độ im lặng tải về bản cập nhật
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  // Bỏ qua lỗi dev mode
  autoUpdater.forceDevUpdateConfig = true

  // Kiểm tra cập nhật
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('[AutoUpdater] Kiểm tra cập nhật thất bại:', err)
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Cập nhật có sẵn:', info.version)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Cập nhật đã tải xong:', info.version)
    // Thông báo cho renderer process (SettingsPanel) biết để hiện nút "Khởi động lại"
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED, info.version)
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Lỗi cập nhật:', err)
  })
}

export function installUpdate(): void {
  // Cài đặt cập nhật và khởi động lại ứng dụng ngay lập tức
  autoUpdater.quitAndInstall(false, true)
}
