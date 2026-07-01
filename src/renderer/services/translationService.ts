// ============================================================
// HotLingo — Translation Service
// Orchestrator cho các translation providers
// ============================================================

import { translateWithGoogle } from './googleTranslate'
import { translateWithOpenAI, translateWithOpenAIStream } from './openaiTranslate'

export type TranslationProvider = 'google' | 'openai' | 'hotlingo'

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
}

export interface TranslateResult {
  translatedText: string
  detectedLang?: string
  provider: TranslationProvider
  duration: number
}

/**
 * Dịch text với provider đã chọn
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

      case 'hotlingo': {
        // TODO: Implement HotLingo AI credits
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
  } catch (error) {
    console.error(`[DichZa] Translation error (${options.provider}):`, error)
    throw error
  }
}

/**
 * Stream translation (OpenAI only)
 * Trả về AsyncGenerator yield từng token
 */
export async function* translateStream(
  options: TranslateOptions
): AsyncGenerator<string, void, unknown> {
  if (options.provider !== 'openai') {
    // Non-streaming providers: trả kết quả 1 lần
    const result = await translate(options)
    yield result.translatedText
    return
  }

  // OpenAI streaming
  yield* translateWithOpenAIStream(
    options.text,
    options.from,
    options.to,
    options.smartContext,
    options.apiKey,
    options.model
  )
}
