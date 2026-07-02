// ============================================================
// DichZa — Clipboard Manager
// Monitor clipboard for auto-translation feature
// ============================================================

import { clipboard } from 'electron'

let clipboardInterval: NodeJS.Timeout | null = null
let lastClipboardText = ''

export type ClipboardCallback = (text: string) => void

/**
 * Bắt đầu theo dõi clipboard
 * Mỗi 500ms kiểm tra xem có text mới được copy vào clipboard không.
 */
export function startClipboardMonitor(onTextChanged: ClipboardCallback): void {
  if (clipboardInterval) return

  // Lưu lại text hiện tại để không bị trigger ngay khi bật
  lastClipboardText = clipboard.readText()

  clipboardInterval = setInterval(() => {
    const currentText = clipboard.readText()

    // Nếu có text mới và không rỗng
    if (currentText !== lastClipboardText && currentText.trim().length > 0) {
      lastClipboardText = currentText
      onTextChanged(currentText)
    }
  }, 500)

  console.log('[DichZa] Clipboard monitor started')
}

/**
 * Dừng theo dõi clipboard
 */
export function stopClipboardMonitor(): void {
  if (clipboardInterval) {
    clearInterval(clipboardInterval)
    clipboardInterval = null
    console.log('[DichZa] Clipboard monitor stopped')
  }
}

/**
 * Copy text vào clipboard (bỏ qua monitor)
 */
export function copyToClipboard(text: string): void {
  // Cập nhật lastClipboardText trước khi write để monitor bỏ qua lần copy này
  lastClipboardText = text
  clipboard.writeText(text)
}
