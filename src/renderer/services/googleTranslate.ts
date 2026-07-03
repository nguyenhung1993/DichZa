// ============================================================
// DichZa — Google Translate Service (Free)
// Dùng google-translate-api-x (unofficial, free, unlimited)
// ============================================================

import { withRetry } from './retryHelper'

/**
 * Dịch text bằng Google Translate (free)
 * Tự động retry 3 lần khi bị rate limit (429)
 */
export async function translateWithGoogle(
  text: string,
  from: string,
  to: string
): Promise<{ text: string; detectedLang?: string }> {
  return withRetry(
    () => window.dichza.translateGoogle(text, from, to),
    {
      maxRetries: 3,
      baseDelay: 1000,
      onRetry: (attempt, error, delay) => {
        console.warn(
          `[DichZa] Google Translate retry ${attempt}/3 (chờ ${delay}ms):`,
          error.message
        )
      }
    }
  )
}

/**
 * Detect language
 */
export async function detectLanguage(text: string): Promise<string | undefined> {
  try {
    const { translate } = await import('google-translate-api-x')
    const result = await translate(text, { to: 'en' })
    return Array.isArray(result) ? result[0]?.from?.language?.iso : result.from?.language?.iso
  } catch {
    return undefined
  }
}
