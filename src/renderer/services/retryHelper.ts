// ============================================================
// DichZa — Retry Helper
// Retry thông minh với exponential backoff cho các API calls
// ============================================================

export interface RetryOptions {
  /** Số lần retry tối đa (mặc định 3) */
  maxRetries?: number
  /** Delay ban đầu tính bằng ms (mặc định 1000) */
  baseDelay?: number
  /** Hàm kiểm tra có nên retry không (mặc định: retry lỗi 429/network) */
  shouldRetry?: (error: any) => boolean
  /** Callback mỗi lần retry (để hiện thông báo) */
  onRetry?: (attempt: number, error: any, nextDelay: number) => void
}

/**
 * Kiểm tra lỗi có phải do rate limit / network tạm thời hay không
 */
export function isRetryableError(error: any): boolean {
  const message = error?.message?.toLowerCase() || ''
  return (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('timeout') ||
    message.includes('503') ||
    message.includes('502')
  )
}

/**
 * Wrap một async function với retry logic
 * Sử dụng exponential backoff: delay * 2^attempt
 *
 * @example
 * const result = await withRetry(() => translateWithGoogle(text, from, to), {
 *   maxRetries: 3,
 *   baseDelay: 1000,
 * })
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = isRetryableError,
    onRetry
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Nếu đã hết lần retry hoặc lỗi không nên retry → throw ngay
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error
      }

      // Exponential backoff: 1s → 2s → 4s
      const delay = baseDelay * Math.pow(2, attempt)

      if (onRetry) {
        onRetry(attempt + 1, error, delay)
      }

      console.warn(
        `[DichZa] Retry ${attempt + 1}/${maxRetries} sau ${delay}ms:`,
        error.message
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Không bao giờ đến đây nhưng TypeScript cần
  throw lastError
}
