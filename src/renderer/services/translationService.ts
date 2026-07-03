// ============================================================
// DichZa — Translation Service
// Orchestrator cho các translation providers
// ============================================================

import { translateWithGoogle } from './googleTranslate'
import { translateWithOpenAI, translateWithOpenAIStream } from './openaiTranslate'
import { translateWithGemini, translateWithGeminiStream } from './geminiTranslate'

export type TranslationProvider = 'google' | 'openai' | 'gemini' | 'dichza'

export interface TranslateOptions {
  text: string
  from: string
  to: string
  provider: TranslationProvider
  /** Smart context cho AI translation */
  smartContext?: import('../../shared/types').SmartContext
  /** API key (OpenAI) */
  apiKey?: string
  /** Model (OpenAI) */
  model?: string
  /** Gemini API key */
  geminiApiKey?: string
  /** Gemini model */
  geminiModel?: string
}

export interface TranslateResult {
  translatedText: string
  detectedLang?: string
  provider: TranslationProvider
  duration: number
  /** Nếu đã fallback từ provider khác */
  fallbackFrom?: TranslationProvider
}

/**
 * Dịch text với provider đã chọn
 * Tự động fallback nếu Google bị rate limit
 */
export async function translate(options: TranslateOptions): Promise<TranslateResult> {
  const startTime = Date.now()

  try {
    let translatedText: string
    let detectedLang: string | undefined

    switch (options.provider) {
      case 'google': {
        const result = await translateWithGoogle(options.text, options.from, options.to)
        translatedText = result.text
        detectedLang = result.detectedLang
        break
      }

      case 'openai': {
        translatedText = await translateWithOpenAI(
          options.text,
          options.from,
          options.to,
          options.smartContext,
          options.apiKey,
          options.model
        )
        break
      }

      case 'gemini': {
        translatedText = await translateWithGemini(
          options.text,
          options.from,
          options.to,
          options.smartContext,
          options.geminiApiKey,
          options.geminiModel
        )
        break
      }

      case 'dichza': {
        // TODO: Implement DichZa AI credits
        // Tạm thời fallback sang Google
        const result = await translateWithGoogle(options.text, options.from, options.to)
        translatedText = result.text
        detectedLang = result.detectedLang
        break
      }

      default:
        throw new Error(`Unknown provider: ${options.provider}`)
    }

    return {
      translatedText,
      detectedLang,
      provider: options.provider,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    console.error(`[DichZa] Translation error (${options.provider}):`, error)

    // ── Fallback logic: Google fail → thử Gemini (nếu có key) ──
    if (options.provider === 'google' && options.geminiApiKey) {
      console.warn('[DichZa] Google Translate fail, fallback sang Gemini...')
      try {
        const fallbackText = await translateWithGemini(
          options.text,
          options.from,
          options.to,
          options.smartContext,
          options.geminiApiKey,
          options.geminiModel
        )
        return {
          translatedText: fallbackText,
          provider: 'gemini',
          duration: Date.now() - startTime,
          fallbackFrom: 'google'
        }
      } catch (fallbackError: any) {
        console.error('[DichZa] Gemini fallback cũng fail:', fallbackError)
        // Throw lỗi gốc từ Google (thông tin hữu ích hơn)
      }
    }

    throw error
  }
}

/**
 * Stream translation (OpenAI / Gemini)
 * Trả về AsyncGenerator yield từng token
 */
export async function* translateStream(
  options: TranslateOptions
): AsyncGenerator<string, void, unknown> {
  if (options.provider === 'openai') {
    yield* translateWithOpenAIStream(
      options.text,
      options.from,
      options.to,
      options.smartContext,
      options.apiKey,
      options.model
    )
    return
  }

  if (options.provider === 'gemini') {
    yield* translateWithGeminiStream(
      options.text,
      options.from,
      options.to,
      options.smartContext,
      options.geminiApiKey,
      options.geminiModel
    )
    return
  }

  // Non-streaming providers: trả kết quả 1 lần
  const result = await translate(options)
  yield result.translatedText
}
