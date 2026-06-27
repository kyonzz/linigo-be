const RETRYABLE = /503|529|overloaded|high demand|temporarily unavailable/i

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
      await new Promise(r => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)))
    }
  }
  throw lastError
}
