// ============================================================
// DichZa — App Root Component
// Routing giữa TrayPopup (main) và Overlay
// ============================================================

import { useState, useEffect } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import TrayPopup from './components/TrayPopup/TrayPopup'
import TranslationOverlay from './components/Overlay/TranslationOverlay'
import RegionSelector from './components/OCR/RegionSelector'

type AppView = 'main' | 'overlay' | 'ocr'

function App(): JSX.Element {
  // Xác định view dựa trên hash URL
  const [view, setView] = useState<AppView>('main')
  const { settings, loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()
    
    // Lắng nghe thay đổi từ các cửa sổ khác
    if (window.dichza && window.dichza.onSettingsChanged) {
      return window.dichza.onSettingsChanged((newSettings) => {
        useSettingsStore.setState({ settings: newSettings })
      })
    }
  }, [loadSettings])

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark')
  }, [settings.theme])

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('overlay')) {
      setView('overlay')
    } else if (hash.includes('ocr')) {
      setView('ocr')
    } else {
      setView('main')
    }
  }, [])

  if (view === 'overlay') {
    return <TranslationOverlay />
  }

  if (view === 'ocr') {
    return <RegionSelector />
  }

  return <TrayPopup />
}

export default App
