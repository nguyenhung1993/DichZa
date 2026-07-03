import { useState, useEffect } from 'react'
import { AppSettings } from '../../../shared/types'
import { useSettingsStore } from '../../stores/settingsStore'
import ContextSettings from './ContextSettings'
import ShortcutRecorder from './ShortcutRecorder'
import { ipcRenderer } from 'electron'
import './Settings.css'

export default function SettingsPanel() {
  const { settings, updateSettings: updateSetting } = useSettingsStore()
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)

  useEffect(() => {
    if (window.dichza) {
      const cleanupUpdate = window.dichza.onUpdateDownloaded((version) => {
        setUpdateVersion(version)
      })
      return () => {
        if (cleanupUpdate) cleanupUpdate()
      }
    }
  }, [])

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
            <option value="gemini">Gemini (Free Tier)</option>
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
              <div style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.7 }}>
                Lấy API key tại: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>platform.openai.com</a>
              </div>
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
        {settings.defaultProvider === 'gemini' && (
          <>
            <div className="settings-item settings-item--col">
              <span className="settings-item__label">Gemini API Key</span>
              <input 
                type="password" 
                className="settings-input"
                placeholder="AIza..."
                value={settings.geminiApiKey || ''}
                onChange={e => updateSetting({ geminiApiKey: e.target.value })}
              />
              <div style={{ marginTop: 4, fontSize: '0.8rem', opacity: 0.7 }}>
                Lấy API key miễn phí tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>aistudio.google.com</a>
              </div>
            </div>
            <div className="settings-item settings-item--col">
              <span className="settings-item__label">Model</span>
              <select
                className="settings-item__select"
                value={settings.geminiModel || 'gemini-2.0-flash'}
                onChange={e => updateSetting({ geminiModel: e.target.value })}
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Nhanh, Miễn phí)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Mới nhất)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Chính xác nhất)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {(settings.defaultProvider === 'openai' || settings.defaultProvider === 'gemini') && (
        <div className="settings-group animate-fade-in">
          <h3 className="settings-group__title">🧠 Smart Context</h3>
          <ContextSettings settings={settings} onSave={updateSetting} />
        </div>
      )}

      <div className="settings-group">
        <h3 className="settings-group__title">⚙️ Hệ thống & Phím tắt</h3>
        <div className="settings-item">
          <span className="settings-item__label">Khởi động cùng Windows</span>
          <label className="settings-switch">
            <input 
              type="checkbox" 
              checked={settings.autoStartWithWindows ?? true}
              onChange={e => updateSetting({ autoStartWithWindows: e.target.checked })}
            />
            <span className="settings-switch__slider"></span>
          </label>
        </div>
        <div className="settings-item">
          <span className="settings-item__label">Phím tắt: Dịch văn bản bôi đen</span>
          <ShortcutRecorder 
            initialShortcut={settings.translateHotkey} 
            onChange={(shortcut) => updateSetting({ translateHotkey: shortcut })} 
          />
        </div>
        <div className="settings-item">
          <span className="settings-item__label">Phím tắt: Dịch màn hình (OCR)</span>
          <ShortcutRecorder 
            initialShortcut={settings.ocrHotkey} 
            onChange={(shortcut) => updateSetting({ ocrHotkey: shortcut })} 
          />
        </div>
      </div>

      <div className="settings-group">
        <h3 className="settings-group__title">🎨 Giao diện</h3>
        <div className="settings-item">
          <span className="settings-item__label">Chế độ hiển thị (Theme)</span>
          <select 
             className="settings-item__select"
             value={settings.theme || 'dark'}
             onChange={e => updateSetting({ theme: e.target.value as any })}
          >
            <option value="dark">🌙 Chế độ Tối (Dark)</option>
            <option value="light">☀️ Chế độ Sáng (Light)</option>
          </select>
        </div>
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
        {updateVersion && (
          <div className="settings-item" style={{ flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: '#4CAF50', fontSize: '13px', fontWeight: 'bold' }}>
              ✨ Đã tải xong bản cập nhật mới ({updateVersion})
            </span>
            <button 
              className="settings-quit" 
              style={{ backgroundColor: '#4CAF50', color: 'white', width: '100%', padding: '10px' }}
              onClick={() => {
                if (window.dichza) window.dichza.installUpdate()
              }}
            >
              🔄 Khởi động lại & Cập nhật
            </button>
          </div>
        )}
      </div>

      <button
        className="settings-quit"
        onClick={() => {
          if (window.dichza) window.dichza.quitApp()
        }}
      >
        ❌ Thoát DichZa
      </button>
    </div>
  )
}
