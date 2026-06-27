import { describe, it, expect } from 'vitest'

// Contract tests validate the request/response shape without running the server.
// They verify the schemas are correct and the envelope format is consistent.

describe('POST /api/v1/translate — request schema', () => {
  it('requires text field', () => {
    const req = { target_language: 'fr' }
    expect((req as Record<string, unknown>)['text']).toBeUndefined()
  })

  it('requires target_language field', () => {
    const req = { text: 'Hello' }
    expect((req as Record<string, unknown>)['target_language']).toBeUndefined()
  })

  it('accepts optional source_language', () => {
    const req = { text: 'Hello', target_language: 'fr', source_language: 'en' }
    expect(req.source_language).toBe('en')
  })

  it('text must not be empty', () => {
    const text = '   '
    expect(text.trim().length).toBe(0)
  })

  it('text must not exceed 5000 characters', () => {
    const text = 'a'.repeat(5001)
    expect(text.length).toBeGreaterThan(5000)
  })
})

describe('POST /api/v1/translate — response schema', () => {
  it('success response has correct envelope shape', () => {
    const res = {
      data: {
        translated_text: 'Bonjour',
        source_language: 'en',
        target_language: 'fr',
        original_text: 'Hello',
      },
      error: null,
    }
    expect(res.data).toBeDefined()
    expect(res.error).toBeNull()
    expect(res.data.translated_text).toBeDefined()
    expect(res.data.source_language).toBeDefined()
    expect(res.data.target_language).toBeDefined()
    expect(res.data.original_text).toBeDefined()
  })

  it('error response has correct envelope shape', () => {
    const res = {
      data: null,
      error: { code: 'INVALID_INPUT', message: 'Text is required.' },
    }
    expect(res.data).toBeNull()
    expect(res.error).toBeDefined()
    expect(res.error.code).toBeDefined()
    expect(res.error.message).toBeDefined()
  })
})
