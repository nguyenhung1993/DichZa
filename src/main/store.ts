// ============================================================
// DichZa — Persistent Store (electron-store)
// Lưu settings, history, context vào JSON file
// ============================================================

import Store from 'electron-store'
import { AppSettings, TranslationResult, DEFAULT_SETTINGS } from '../shared/types'
import { MAX_HISTORY_ITEMS } from '../shared/constants'

interface StoreSchema {
  settings: AppSettings
  history: TranslationResult[]
}

let store: Store<StoreSchema>

/**
 * Khởi tạo store với default values
 */
export function initStore(): void {
  store = new Store<StoreSchema>({
    name: 'dichza-config',
    defaults: {
      settings: DEFAULT_SETTINGS,
      history: []
    }
  })
}

/**
 * Lấy settings hiện tại
 */
export function getSettings(): AppSettings {
  return store.get('settings', DEFAULT_SETTINGS)
}

/**
 * Cập nhật settings
 */
export function setSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...settings }
  store.set('settings', updated)
  return updated
}

/**
 * Lấy lịch sử dịch
 */
export function getHistory(): TranslationResult[] {
  return store.get('history', [])
}

/**
 * Thêm bản dịch vào lịch sử (giới hạn MAX_HISTORY_ITEMS)
 */
export function addHistory(item: TranslationResult): void {
  const history = getHistory()
  history.unshift(item)

  // Giới hạn số lượng
  if (history.length > MAX_HISTORY_ITEMS) {
    history.splice(MAX_HISTORY_ITEMS)
  }

  store.set('history', history)
}

/**
 * Xóa toàn bộ lịch sử
 */
export function clearHistory(): void {
  store.set('history', [])
}

/**
 * Xóa 1 item khỏi lịch sử
 */
export function removeHistoryItem(id: string): void {
  const history = getHistory()
  const filtered = history.filter((item) => item.id !== id)
  store.set('history', filtered)
}

export { store }
