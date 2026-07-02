// ============================================================
// DichZa — Settings Zustand Store
// ============================================================

import { create } from 'zustand'
import { AppSettings, DEFAULT_SETTINGS } from '../../shared/types'

interface SettingsState {
  settings: AppSettings
  isLoaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    if (window.dichza) {
      const settings = await window.dichza.getSettings()
      set({ settings, isLoaded: true })
    }
  },

  updateSettings: async (partial) => {
    const current = get().settings
    const updated = { ...current, ...partial }

    set({ settings: updated })

    if (window.dichza) {
      await window.dichza.setSettings(partial)
    }
  }
}))
