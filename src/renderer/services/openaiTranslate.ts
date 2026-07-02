// ============================================================
// DichZa — OpenAI Translation Service (Paid, Streaming)
// Dịch bằng OpenAI với Smart Context, SSE streaming
// ============================================================

import { SUPPORTED_LANGUAGES } from '../../shared/constants'

import type { SmartContext } from '../../shared/types'

/**
 * Build system prompt cho translation kết hợp Smart Context
 */
function buildSystemPrompt(from: string, to: string, context?: SmartContext): string {
  const fromName = SUPPORTED_LANGUAGES.find(l => l.code === from)?.nameEn || from
  const toName = SUPPORTED_LANGUAGES.find(l => l.code === to)?.nameEn || to

  // Bắt đầu bằng role từ persistent context, fallback về mặc định
  let prompt = context?.persistent?.role || `You are a professional translator.`
  prompt += ` Translate the following text`

  if (from === 'auto') {
    prompt += ` to ${toName}.`
  } else {
    prompt += ` from ${fromName} to ${toName}.`
  }

  // Thêm tone và domain
  if (context?.persistent?.tone) {
    prompt += `\nTone: ${context.persistent.tone}`
  }
  if (context?.persistent?.domain && context.persistent.domain !== 'general') {
    prompt += `\nDomain/Field: ${context.persistent.domain}`
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
 * Non-streaming OpenAI translation
 */
export async function translateWithOpenAI(
  text: string,
  from: string,
  to: string,
  context?: SmartContext,
  apiKey?: string,
  model?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key chưa được cấu hình. Vào Cài đặt để thêm.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(from, to, context) },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || ''
}

/**
 * Streaming OpenAI translation (yield từng token)
 */
export async function* translateWithOpenAIStream(
  text: string,
  from: string,
  to: string,
  context?: import('../../shared/types').SmartContext,
  apiKey?: string,
  model?: string
): AsyncGenerator<string, void, unknown> {
  if (!apiKey) {
    throw new Error('OpenAI API key chưa được cấu hình. Vào Cài đặt để thêm.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(from, to, context) },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 4096,
      stream: true
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`)
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

      const data = trimmed.slice(6) // Remove "data: " prefix
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const token = parsed.choices?.[0]?.delta?.content
        if (token) {
          yield token
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  }
}
