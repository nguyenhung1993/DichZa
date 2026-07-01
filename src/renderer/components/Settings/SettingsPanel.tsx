import { useState, useEffect } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '../../../shared/types'
import ContextSettings from './ContextSettings'
import './Settings.css'

export default function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (window.hotlingo) {
      window.hotlingo.getSettings().then(s => setSettings(s))
    }
  }, [])

  const updateSetting = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    if (window.hotlingo) {
      await window.hotlingo.setSettings(newSettings)
    }
  }

  return (
    <div className="settings-panel animate-fade-in">
      <div className="settings-group">
        <h3 className="settings-group__title">⌨️ Phím tắt</h3>
        <div className="settings-item">
          <span className="settings-item__label">Dịch text</span>
          <input 
            type="text" 
            className="settings-input settings-input--hotkey"
            value={settings.translateHotkey}
            onChange={e => updateSetting({ translateHotkey: e.target.value })}
          />
        </div>
        <div className="settings-item">
          <span className="settings-item__label">OCR Screenshot</span>
          <input 
            type="text" 
            className="settings-input settings-input--hotkey"
            value={settings.ocrHotkey}
            onChange={e => updateSetting({ ocrHotkey: e.target.value })}
          />
        </div>
      </div>

      <div className="settings-group">
        <h3 className="settings-group__title">🌐 Nhà cung cấp</h3>
        <div className="settings-item">
          <span className="settings-item__label">Mặc định</span>
          <select 
             className="settings-item__select"
             value={settings.defaultProvider}
             onChange={e => updateSetting({ defaultProvider: e.target.value as any })}
          >
            <option value="google">Google Translate (Free)</option>
            <option value="openai">OpenAI (Pro)</option>
          </select>
        </div>
        {settings.defaultProvider === 'openai' && (
          <>
            <div className="settings-item settings-item--col">
              <span className="settings-item__label">OpenAI API Key</span>
              <input 
                type="password" 
                className="settings-input"
                placeholder="sk-..."
                value={settings.openaiApiKey || ''}
                onChange={e => updateSetting({ openaiApiKey: e.target.value })}
              />
            </div>
            <div className="settings-item settings-item--col">
              <span className="settings-item__label">Model</span>
              <input 
                type="text" 
                className="settings-input"
                value={settings.openaiModel}
                onChange={e => updateSetting({ openaiModel: e.target.value })}
              />
            </div>
          </>
        )}
      </div>

      <div className="settings-group">
        <h3 className="settings-group__title">🧠 Smart Context</h3>
        <ContextSettings settings={settings} onSave={updateSetting} />
      </div>

      <div className="settings-group">
        <h3 className="settings-group__title">🎨 Giao diện</h3>
        <div className="settings-item">
          <span className="settings-item__label">Ngôn ngữ UI</span>
          <select 
             className="settings-item__select"
             value={settings.uiLanguage}
             onChange={e => updateSetting({ uiLanguage: e.target.value as any })}
          >
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
      </div>

      <div className="settings-group">
        <h3 className="settings-group__title">ℹ️ Thông tin</h3>
        <div className="settings-item">
          <span className="settings-item__label">Phiên bản</span>
          <span className="settings-item__value-text">1.0.0</span>
        </div>
      </div>

      <button
        className="settings-quit"
        onClick={() => {
          if (window.hotlingo) window.hotlingo.quitApp()
        }}
      >
        ❌ Thoát DichZa
      </button>
    </div>
  )
}
