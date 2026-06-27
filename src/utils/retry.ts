const RETRYABLE = /503|529|429|overloaded|high demand|temporarily unavailable|quota/i
const RETRY_DELAY_MS = /retryDelay.*?(\d+)s/i

function parseRetryDelay(msg: string, baseDelayMs: number, attempt: number): number {
  const match = msg.match(RETRY_DELAY_MS)
  if (match) return (parseInt(match[1], 10) + 2) * 1000
  return baseDelayMs * 2 ** (attempt - 1)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      if (!RETRYABLE.test(msg) || attempt === maxAttempts) throw err
      const delay = parseRetryDelay(msg, baseDelayMs, attempt)
      console.log(`[retry] attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastError
}
