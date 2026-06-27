import { describe, it, expect } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../../src/services/languages.js'

describe('GET /api/v1/languages — response schema', () => {
  it('languages list has at least 25 entries', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(25)
  })

  it('each language has code and display_name', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(lang).toHaveProperty('code')
      expect(lang).toHaveProperty('display_name')
      expect(typeof lang.code).toBe('string')
      expect(typeof lang.display_name).toBe('string')
      expect(lang.code.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('response envelope has correct shape', () => {
    const res = { data: { languages: SUPPORTED_LANGUAGES }, error: null }
    expect(res.data).toBeDefined()
    expect(res.error).toBeNull()
    expect(Array.isArray(res.data.languages)).toBe(true)
  })
})
