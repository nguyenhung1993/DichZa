// ============================================================
// DichZa — Translation Overlay Component
// Hiện bản dịch ngay cạnh cursor, streaming effect
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import './TranslationOverlay.css'

import { translateStream, TranslateOptions } from '../../services/translationService'

interface TranslationData {
  text: string
  sourceLang: string
  targetLang: string
  provider: string
}

function TranslationOverlay(): JSX.Element {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [provider, setProvider] = useState('google')
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [perMessageContext, setPerMessageContext] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync pinned state to main process
  useEffect(() => {
    if (window.dichza?.setPinned) {
      window.dichza.setPinned(isPinned)
    }
  }, [isPinned])

  // Lắng nghe selected text từ main process
  useEffect(() => {
    if (!window.dichza) return

    const cleanup = window.dichza.onSelectedText(
      async (data: TranslationData) => {
        setSourceText(data.text)
        setProvider(data.provider)
        setIsTranslating(true)
        setTranslatedText('')
        setCopyFeedback(false)

        await doTranslate(data.text, data.sourceLang, data.targetLang, data.provider as any)
      }
    )

    return cleanup
  }, [perMessageContext]) // Depend on perMessageContext so it uses the latest value if user typed something before selecting text again, although usually context is typed AFTER?

  // Thực hiện dịch
  const doTranslate = async (text: string, sourceLang: string, targetLang: string, provider: 'google' | 'openai' | 'gemini' | 'dichza') => {
    try {
      setIsTranslating(true)
      setTranslatedText('')

      const settings = await window.dichza.getSettings()

      const options: TranslateOptions = {
        text,
        from: sourceLang,
        to: targetLang,
        provider,
        smartContext: {
          ...settings.smartContext,
          perMessage: perMessageContext // Use current typed context
        },
        apiKey: settings.openaiApiKey,
        model: settings.openaiModel,
        geminiApiKey: settings.geminiApiKey,
        geminiModel: settings.geminiModel
      }

      const stream = translateStream(options)
      for await (const chunk of stream) {
        setTranslatedText(prev => prev + chunk)
      }
    } catch (error: any) {
      setTranslatedText(`[Lỗi]: ${error?.message || 'Không thể dịch'}`)
    } finally {
      setIsTranslating(false)
    }
  }

  // Handle manual translation re-trigger when context changes
  const handleContextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && sourceText) {
      // Dịch lại với context mới
      setTranslatedText('')
      doTranslate(sourceText, 'auto', 'vi', provider as any) // Assuming 'vi' for now, ideally we store latest lang pair
    }
  }

  // Copy translation
  const handleCopy = useCallback(async () => {
    if (window.dichza && translatedText) {
      await window.dichza.copyToClipboard(translatedText)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 1500)
    }
  }, [translatedText])

  // Close overlay
  const handleClose = useCallback(() => {
    if (window.dichza) {
      window.dichza.hideOverlay()
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Provider badge
  const getProviderLabel = (p: string) => {
    switch (p) {
      case 'google': return '🔵 Google'
      case 'openai': return '🟢 OpenAI'
      case 'gemini': return '🔷 Gemini'
      case 'dichza': return '🟣 DichZa AI'
      default: return p
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto resize textarea khi sourceText thay đổi
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [sourceText])

  // Tự động resize overlay window dựa trên content
  useEffect(() => {
    if (!containerRef.current || !window.dichza?.resizeOverlay) return

    const card = containerRef.current.querySelector('.overlay-card')
    if (!card) return

    const header = card.querySelector('.overlay-header')
    const result = card.querySelector('.overlay-result')
    const footer = card.querySelector('.overlay-footer')
    const contextInput = card.querySelector('.overlay-context-input')
    
    let desiredHeight = 0 // No margins!
    if (header) desiredHeight += header.getBoundingClientRect().height
    if (result) desiredHeight += result.scrollHeight
    if (footer) desiredHeight += footer.getBoundingClientRect().height
    if (contextInput) desiredHeight += contextInput.getBoundingClientRect().height

    const maxWindowHeight = Math.min(800, window.screen.availHeight - 40)
    const height = Math.min(desiredHeight, maxWindowHeight)
    const width = Math.ceil(card.getBoundingClientRect().width)

    window.dichza.resizeOverlay(width, height)
  }, [translatedText, isTranslating, provider])

  if (!sourceText && !translatedText) {
    return <div className="overlay-container" />
  }

  return (
    <div className="overlay-container" ref={containerRef}>
      <div className="overlay-card animate-fade-in-scale">
        {/* Header */}
        <div className="overlay-header">
          <span className="overlay-provider">{getProviderLabel(provider)}</span>
          <div className="overlay-actions">
            <button
              className={`overlay-btn overlay-btn--pin ${isPinned ? 'overlay-btn--active' : ''}`}
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Bỏ ghim' : 'Ghim'}
            >
              📌
            </button>
            <button
              className="overlay-btn overlay-btn--close"
              onClick={handleClose}
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Context Input (Only for OpenAI) */}
        {(provider === 'openai' || provider === 'gemini') && (
          <div className="overlay-context-input">
            <input
              type="text"
              placeholder="Thêm context AI (ví dụ: email lịch sự)... rồi nhấn Enter"
              value={perMessageContext}
              onChange={e => setPerMessageContext(e.target.value)}
              onKeyDown={handleContextSubmit}
              className="overlay-context-field"
            />
          </div>
        )}

        {/* Translation result */}
        <div className="overlay-result">
          {isTranslating && !translatedText ? (
            <div className="overlay-loading">
              <div className="overlay-loading__dots">
                <span className="overlay-loading__dot" />
                <span className="overlay-loading__dot" />
                <span className="overlay-loading__dot" />
              </div>
              <span className="overlay-loading__text">Đang dịch...</span>
            </div>
          ) : (
            <span className="overlay-result__text">
              {translatedText}
              {isTranslating && <span className="overlay-cursor" />}
            </span>
          )}
        </div>

        {/* Footer */}
        {translatedText && !isTranslating && (
          <div className="overlay-footer animate-fade-in">
            <button
              className={`overlay-copy ${copyFeedback ? 'overlay-copy--success' : ''}`}
              onClick={handleCopy}
            >
              {copyFeedback ? '✅ Đã copy' : '📋 Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TranslationOverlay
