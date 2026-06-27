import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TranslationService, TranslationError } from '../../src/services/translation.js'

function makeModel(generateContent: ReturnType<typeof vi.fn>) {
  return { generateContent } as Parameters<typeof TranslationService>[0]
}

describe('TranslationService', () => {
  let mockGenerateContent: ReturnType<typeof vi.fn>
  let service: TranslationService

  beforeEach(() => {
    mockGenerateContent = vi.fn()
    service = new TranslationService(makeModel(mockGenerateContent))
  })

  describe('translate()', () => {
    it('returns translated text with explicit source language', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify({ translated_text: 'Bonjour', detected_source_language: 'en' }) },
      })

      const result = await service.translate('Hello', 'fr', 'en')
      expect(result.translated_text).toBe('Bonjour')
      expect(result.source_language).toBe('en')
      expect(result.target_language).toBe('fr')
      expect(result.original_text).toBe('Hello')
    })

    it('auto-detects source language when not provided', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify({ translated_text: 'Good morning', detected_source_language: 'de' }) },
      })

      const result = await service.translate('Guten Morgen', 'en')
      expect(result.source_language).toBe('de')
      expect(result.translated_text).toBe('Good morning')
    })

    it('throws DETECTION_FAILED when detected_source_language is null', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify({ translated_text: '', detected_source_language: null }) },
      })

      await expect(service.translate('???', 'en')).rejects.toMatchObject({ code: 'DETECTION_FAILED' })
    })

    it('throws PROVIDER_UNAVAILABLE on Gemini SDK error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.translate('Hello', 'fr', 'en')).rejects.toBeInstanceOf(TranslationError)
    })

    it('throws PROVIDER_UNAVAILABLE with correct code on SDK error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.translate('Hello', 'fr', 'en')).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' })
    })
  })
})
