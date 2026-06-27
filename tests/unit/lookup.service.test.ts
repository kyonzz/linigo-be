import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LookupService, LookupError } from '../../src/services/lookup.js'

const fullResponse = {
  word: 'succeed',
  part_of_speech: 'verb',
  pronunciation: { uk_ipa: '/səkˈsiːd/', us_ipa: '/səkˈsiːd/' },
  definitions: [
    {
      cefr_level: 'B1',
      grammar_label: '[I]',
      definition: 'to achieve something you have been trying to do',
      definition_translation: 'đạt được',
      examples: ['She succeeded.', 'They succeeded in the end.'],
    },
  ],
  word_family: [{ word: 'success', part_of_speech: 'noun' }],
  phrases: [{ phrase: 'succeed in doing something', definition: 'to manage', example: 'Did you succeed?' }],
  synonyms: ['achieve', 'accomplish'],
  translation: 'thành công',
}

function makeModel(generateContent: ReturnType<typeof vi.fn>) {
  return { generateContent } as Parameters<typeof LookupService>[0]
}

describe('LookupService', () => {
  let mockGenerateContent: ReturnType<typeof vi.fn>
  let service: LookupService

  beforeEach(() => {
    mockGenerateContent = vi.fn()
    service = new LookupService(makeModel(mockGenerateContent))
  })

  it('returns full dictionary entry on success', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => JSON.stringify(fullResponse) },
    })

    const result = await service.lookup('succeed', 'vi')
    expect(result.word).toBe('succeed')
    expect(result.part_of_speech).toBe('verb')
    expect(result.definitions.length).toBeGreaterThan(0)
    expect(result.definitions[0].cefr_level).toBe('B1')
    expect(result.translation).toBe('thành công')
  })

  it('strips markdown code fences before parsing', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '```json\n' + JSON.stringify(fullResponse) + '\n```' },
    })

    const result = await service.lookup('succeed', 'vi')
    expect(result.word).toBe('succeed')
  })

  it('throws NOT_ENGLISH_WORD when Gemini signals invalid input', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => JSON.stringify({ error: 'NOT_ENGLISH_WORD', message: 'Not a word.' }) },
    })

    await expect(service.lookup('xyzzy', 'vi')).rejects.toMatchObject({ code: 'NOT_ENGLISH_WORD' })
  })

  it('throws INPUT_TOO_LONG when Gemini signals sentence input', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => JSON.stringify({ error: 'INPUT_TOO_LONG', message: 'Too long.' }) },
    })

    await expect(service.lookup('a b c d e f g h i j k', 'vi')).rejects.toMatchObject({ code: 'INPUT_TOO_LONG' })
  })

  it('throws PROVIDER_UNAVAILABLE on SDK error', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Network failure'))

    await expect(service.lookup('hello', 'vi')).rejects.toBeInstanceOf(LookupError)
    mockGenerateContent.mockRejectedValueOnce(new Error('Network failure'))
    await expect(service.lookup('hello', 'vi')).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' })
  })

  it('throws PROVIDER_UNAVAILABLE on malformed JSON response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'not json at all' },
    })

    await expect(service.lookup('hello', 'vi')).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' })
  })
})
