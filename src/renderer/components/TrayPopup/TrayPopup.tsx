// ============================================================
// DichZa — Tray Popup Component
// Main UI khi click tray icon
// Tabs: Translate | History | Settings
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import './TrayPopup.css'
import SettingsPanel from '../Settings/SettingsPanel'
import { translate } from '../../services/translationService'
import { useSettingsStore } from '../../stores/settingsStore'

type Tab = 'translate' | 'history' | 'settings'

import { TranslationResult } from '../../shared/types'

function TrayPopup(): JSX.Element {
  const { settings, loadSettings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<Tab>('translate')
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('vi')
  const [history, setHistory] = useState<TranslationResult[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Lắng nghe navigation events từ tray menu
  useEffect(() => {
    loadSettings()
    
    if (window.dichza) {
      const cleanup = window.dichza.onNavigate((page: string) => {
        if (page === 'settings' || page === 'history' || page === 'translate') {
          setActiveTab(page as Tab)
        }
      })
      return cleanup
    }
  }, [loadSettings])

  // Load history khi mở tab
  useEffect(() => {
    if (activeTab === 'history' && window.dichza) {
      window.dichza.getHistory().then((items) => {
        setHistory(items || [])
      })
    }
  }, [activeTab])

  // Dịch text
  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || isTranslating) return

    setIsTranslating(true)
    setTranslatedText('')

    try {
      const result = await translate({
        text: inputText,
        from: sourceLang,
        to: targetLang,
        provider: settings.defaultProvider,
        smartContext: settings.smartContext,
        apiKey: settings.openaiApiKey,
        model: settings.openaiModel
      })

      setTranslatedText(result.translatedText)

      // Lưu lịch sử
      const historyItem: TranslationResult = {
        id: crypto.randomUUID(),
        sourceText: inputText,
        translatedText: result.translatedText,
        sourceLang: sourceLang as any,
        targetLang: targetLang as any,
        provider: result.provider,
        timestamp: Date.now(),
        duration: result.duration || 0,
        source: 'selection'
      }
      
      if (window.dichza) {
        await window.dichza.addHistory(historyItem)
      }
      
      // Update local history
      setHistory(prev => [historyItem, ...prev])

    } catch (error: any) {
      console.error('Translation error:', error)
      setTranslatedText(`Lỗi khi dịch: ${error.message || 'Vui lòng thử lại.'}`)
    } finally {
      setIsTranslating(false)
    }
  }, [inputText, isTranslating, sourceLang, targetLang, settings])

  // Copy translation
  const handleCopy = useCallback(async (text: string) => {
    if (window.dichza) {
      await window.dichza.copyToClipboard(text)
    } else {
      navigator.clipboard.writeText(text)
    }
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }, [])

  // Swap languages
  const handleSwapLangs = useCallback(() => {
    if (sourceLang === 'auto') return
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }, [sourceLang, targetLang])

  // Filtered history
  const filteredHistory = history.filter(
    (item) =>
      item.sourceText.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <div className="app-container">
      {/* ─── Header ─── */}
      <header className="tray-header">
        <div className="tray-header__logo">
          <span className="tray-header__icon">🌐</span>
          <h1 className="tray-header__title">DichZa</h1>
        </div>
        <div className="tray-header__badge">
          <span className="tray-header__status-dot" />
          <span className="tray-header__status-text">Sẵn sàng</span>
        </div>
      </header>

      {/* ─── Tab Navigation ─── */}
      <nav className="tray-tabs">
        <button
          className={`tray-tabs__item ${activeTab === 'translate' ? 'tray-tabs__item--active' : ''}`}
          onClick={() => setActiveTab('translate')}
        >
          <span className="tray-tabs__icon">✏️</span>
          <span>Dịch</span>
        </button>
        <button
          className={`tray-tabs__item ${activeTab === 'history' ? 'tray-tabs__item--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="tray-tabs__icon">📋</span>
          <span>Lịch sử</span>
        </button>
        <button
          className={`tray-tabs__item ${activeTab === 'settings' ? 'tray-tabs__item--active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tray-tabs__icon">⚙️</span>
          <span>Cài đặt</span>
        </button>
      </nav>

      {/* ─── Tab Content ─── */}
      <main className="tray-content">
        {/* Translate Tab */}
        {activeTab === 'translate' && (
          <div className="translate-panel animate-fade-in">
            {/* Language selector */}
            <div className="lang-selector">
              <select
                className="lang-selector__select"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                <option value="auto">🔍 Tự động</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 Tiếng Anh</option>
                <option value="ja">🇯🇵 Tiếng Nhật</option>
                <option value="ko">🇰🇷 Tiếng Hàn</option>
                <option value="zh-CN">🇨🇳 Tiếng Trung</option>
                <option value="fr">🇫🇷 Tiếng Pháp</option>
                <option value="de">🇩🇪 Tiếng Đức</option>
              </select>

              <button
                className="lang-selector__swap"
                onClick={handleSwapLangs}
                disabled={sourceLang === 'auto'}
                title="Đổi ngôn ngữ"
              >
                ⇄
              </button>

              <select
                className="lang-selector__select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 Tiếng Anh</option>
                <option value="ja">🇯🇵 Tiếng Nhật</option>
                <option value="ko">🇰🇷 Tiếng Hàn</option>
                <option value="zh-CN">🇨🇳 Tiếng Trung</option>
                <option value="fr">🇫🇷 Tiếng Pháp</option>
                <option value="de">🇩🇪 Tiếng Đức</option>
              </select>
            </div>

            {/* Input */}
            <div className="translate-input">
              <textarea
                className="translate-input__textarea"
                placeholder="Nhập hoặc dán text để dịch..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleTranslate()
                  }
                }}
                rows={3}
              />
              {inputText && (
                <button
                  className="translate-input__clear"
                  onClick={() => {
                    setInputText('')
                    setTranslatedText('')
                  }}
                  title="Xóa"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Translate button */}
            <button
              className={`translate-btn ${isTranslating ? 'translate-btn--loading' : ''}`}
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
            >
              {isTranslating ? (
                <>
                  <span className="translate-btn__spinner animate-spin">◌</span>
                  <span>Đang dịch...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Dịch ngay</span>
                </>
              )}
            </button>

            {/* Output */}
            {translatedText && (
              <div className="translate-output animate-fade-in-up">
                <div className="translate-output__text">{translatedText}</div>
                <div className="translate-output__actions">
                  <button
                    className="translate-output__btn"
                    onClick={() => handleCopy(translatedText)}
                  >
                    {copyFeedback ? '✅ Đã copy' : '📋 Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Hotkey hint */}
            <div className="hotkey-hint">
              <span className="hotkey-hint__text">💡 Mẹo: Chọn text ở bất kỳ app nào rồi bấm</span>
              <kbd className="hotkey-hint__key">F4</kbd>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-panel animate-fade-in">
            <div className="history-search">
              <span className="history-search__icon">🔍</span>
              <input
                className="history-search__input"
                type="text"
                placeholder="Tìm trong lịch sử..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div className="history-empty">
                <span className="history-empty__icon">📭</span>
                <p className="history-empty__text">
                  {history.length === 0
                    ? 'Chưa có bản dịch nào'
                    : 'Không tìm thấy kết quả'}
                </p>
              </div>
            ) : (
              <div className="history-list">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="history-item animate-fade-in-up"
                    onClick={() => handleCopy(item.translatedText)}
                    title="Click để copy bản dịch"
                  >
                    <div className="history-item__source">{item.sourceText}</div>
                    <div className="history-item__arrow">→</div>
                    <div className="history-item__translated">{item.translatedText}</div>
                    <div className="history-item__meta">
                      <span className="history-item__provider">{item.provider}</span>
                      <span className="history-item__time">
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <button
                className="history-clear"
                onClick={async () => {
                  if (window.dichza) {
                    await window.dichza.clearHistory()
                    setHistory([])
                  }
                }}
              >
                🗑️ Xóa tất cả
              </button>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default TrayPopup
