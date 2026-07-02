// ============================================================
// DichZa — Google Translate Service (Free)
// Dùng google-translate-api-x (unofficial, free, unlimited)
// ============================================================

/**
 * Dịch text bằng Google Translate (free)
 */
export async function translateWithGoogle(
  text: string,
  from: string,
  to: string
): Promise<{ text: string; detectedLang?: string }> {
  try {
    return await window.dichza.translateGoogle(text, from, to)
  } catch (error: any) {
    console.error('[DichZa] Google Translate error:', error.message)

    // Fallback: nếu google-translate-api-x fail
    if (error.message?.includes('403') || error.message?.includes('429')) {
      throw new Error('Google Translate đang bị rate limit. Vui lòng thử lại sau.')
    }

    throw new Error(`Google Translate lỗi: ${error.message}`)
  }
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
