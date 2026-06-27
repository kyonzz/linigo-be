import { describe, it, expect } from 'vitest'
import { isSupported, SUPPORTED_LANGUAGES } from '../../src/services/languages.js'

describe('languages service', () => {
  it('returns true for supported language codes', () => {
    expect(isSupported('en')).toBe(true)
    expect(isSupported('fr')).toBe(true)
    expect(isSupported('ja')).toBe(true)
    expect(isSupported('zh')).toBe(true)
  })

  it('returns false for unsupported codes', () => {
    expect(isSupported('xx')).toBe(false)
    expect(isSupported('')).toBe(false)
    expect(isSupported('EN')).toBe(false)
  })

  it('has at least 25 supported languages', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(25)
  })

  it('all language codes are unique', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code)
    const unique = new Set(codes)
    expect(unique.size).toBe(codes.length)
  })
})
