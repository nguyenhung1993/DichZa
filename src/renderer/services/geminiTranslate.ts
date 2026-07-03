// ============================================================
// DichZa — Gemini Translation Service (Free Tier, Streaming)
// Dịch bằng Google Gemini API với Smart Context, SSE streaming
// ============================================================

import { SUPPORTED_LANGUAGES } from '../../shared/constants'
import type { SmartContext } from '../../shared/types'

/**
 * Build system prompt cho translation kết hợp Smart Context
 * (Tái sử dụng cùng logic với OpenAI)
 */
function buildSystemPrompt(from: string, to: string, context?: SmartContext): string {
  const fromName = SUPPORTED_LANGUAGES.find(l => l.code === from)?.nameEn || from
  const toName = SUPPORTED_LANGUAGES.find(l => l.code === to)?.nameEn || to

  let prompt = context?.persistent?.role || `You are a professional translator.`
  prompt += ` Translate the following text`

  if (from === 'auto') {
    prompt += ` to ${toName}.`
  } else {
    prompt += ` from ${fromName} to ${toName}.`
  }

  if (context?.persistent?.autoDetect) {
    prompt += `\n[AUTO SMART CONTEXT]: You MUST automatically analyze the source text to detect its domain/field (e.g. IT, Medical, Casual chat, Legal) and its tone (e.g. formal, friendly, professional). Dynamically adapt your translation vocabulary and style to perfectly match the detected context.`
  } else {
    if (context?.persistent?.tone) {
      prompt += `\nTone: ${context.persistent.tone}`
    }
    if (context?.persistent?.domain && context.persistent.domain !== 'general') {
      prompt += `\nDomain/Field: ${context.persistent.domain}`
    }
  }

  prompt += `\n\nRules:
- Return ONLY the translated text, nothing else.
- Maintain the original formatting (line breaks, punctuation).
- Keep proper nouns, brand names, and technical terms as-is when appropriate.
- Produce natural, fluent output that reads like native text.`

  // Glossary
  if (context?.persistent?.glossary && Object.keys(context.persistent.glossary).length > 0) {
    prompt += `\n\nGlossary (use these specific translations):`
    for (const [term, trans] of Object.entries(context.persistent.glossary)) {
      prompt += `\n- "${term}" -> "${trans}"`
    }
  }

  // Per-message & Per-screenshot context
  const additionalContexts: string[] = []
  if (context?.perMessage) additionalContexts.push(context.perMessage)
  if (context?.perScreenshot) additionalContexts.push(context.perScreenshot)

  if (additionalContexts.length > 0) {
    prompt += `\n\nAdditional context for this specific translation:\n${additionalContexts.join('\n')}`
  }

  return prompt
}

/**
 * Non-streaming Gemini translation
 */
export async function translateWithGemini(
  text: string,
  from: string,
  to: string,
  context?: SmartContext,
  apiKey?: string,
  model?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API key chưa được cấu hình. Vào Cài đặt để thêm.')
  }

  const modelName = model || 'gemini-2.0-flash'
  const systemPrompt = buildSystemPrompt(from, to, context)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const msg = error?.error?.message || response.statusText
    if (response.status === 429) {
      throw new Error(`Gemini API rate limit: ${msg}`)
    }
    throw new Error(`Gemini error: ${msg}`)
  }

  const data = await response.json()
  const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!resultText) {
    throw new Error('Gemini không trả về kết quả dịch.')
  }

  return resultText.trim()
}

/**
 * Streaming Gemini translation (yield từng token)
 */
export async function* translateWithGeminiStream(
  text: string,
  from: string,
  to: string,
  context?: SmartContext,
  apiKey?: string,
  model?: string
): AsyncGenerator<string, void, unknown> {
  if (!apiKey) {
    throw new Error('Gemini API key chưa được cấu hình. Vào Cài đặt để thêm.')
  }

  const modelName = model || 'gemini-2.0-flash'
  const systemPrompt = buildSystemPrompt(from, to, context)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const msg = error?.error?.message || response.statusText
    if (response.status === 429) {
      throw new Error(`Gemini API rate limit: ${msg}`)
    }
    throw new Error(`Gemini error: ${msg}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const token = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
        if (token) {
          yield token
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  }
}
