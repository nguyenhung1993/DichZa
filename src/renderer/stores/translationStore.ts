// ============================================================
// DichZa — Translation Zustand Store
// Global state cho translation flow
// ============================================================

import { create } from 'zustand'
import { translate, translateStream, TranslationProvider } from '../services/translationService'

interface TranslationState {
  // State
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  provider: TranslationProvider
  isTranslating: boolean
  error: string | null
  streamingTokens: string[]

  // Actions
  setSourceText: (text: string) => void
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
  setProvider: (provider: TranslationProvider) => void
  swapLanguages: () => void
  translateText: (text?: string) => Promise<void>
  translateStreaming: (text?: string) => Promise<void>
  clearTranslation: () => void
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  // Initial state
  sourceText: '',
  translatedText: '',
  sourceLang: 'auto',
  targetLang: 'vi',
  provider: 'google',
  isTranslating: false,
  error: null,
  streamingTokens: [],

  // Actions
  setSourceText: (text) => set({ sourceText: text }),
  setSourceLang: (lang) => set({ sourceLang: lang }),
  setTargetLang: (lang) => set({ targetLang: lang }),
  setProvider: (provider) => set({ provider }),

  swapLanguages: () => {
    const { sourceLang, targetLang } = get()
    if (sourceLang === 'auto') return
    set({ sourceLang: targetLang, targetLang: sourceLang })
  },

  translateText: async (text) => {
    const state = get()
    const inputText = text || state.sourceText

    if (!inputText.trim()) return

    set({ isTranslating: true, error: null, translatedText: '' })

    try {
      const result = await translate({
        text: inputText,
        from: state.sourceLang,
        to: state.targetLang,
        provider: state.provider
      })

      set({
        translatedText: result.translatedText,
        isTranslating: false
      })

    } catch (error: any) {
      set({
        error: error.message,
        isTranslating: false
      })
    }
  },

  translateStreaming: async (text) => {
    const state = get()
    const inputText = text || state.sourceText

    if (!inputText.trim()) return

    set({ isTranslating: true, error: null, translatedText: '', streamingTokens: [] })

    try {
      const stream = translateStream({
        text: inputText,
        from: state.sourceLang,
        to: state.targetLang,
        provider: state.provider
      })

      let fullText = ''
      for await (const token of stream) {
        fullText += token
        set({
          translatedText: fullText,
          streamingTokens: [...get().streamingTokens, token]
        })
      }

      set({ isTranslating: false })

    } catch (error: any) {
      set({
        error: error.message,
        isTranslating: false
      })
    }
  },

  clearTranslation: () =>
    set({
      sourceText: '',
      translatedText: '',
      error: null,
      streamingTokens: []
    })
}))
