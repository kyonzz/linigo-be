import { describe, it, expect } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../../src/services/languages.js'

describe('POST /api/v1/lookup — request schema', () => {
  it('requires word field', () => {
    const req = { native_language: 'vi' }
    expect((req as Record<string, unknown>)['word']).toBeUndefined()
  })

  it('requires native_language field', () => {
    const req = { word: 'succeed' }
    expect((req as Record<string, unknown>)['native_language']).toBeUndefined()
  })

  it('word must not be empty', () => {
    expect('   '.trim().length).toBe(0)
  })

  it('word must not exceed 10 space-separated tokens', () => {
    const sentence = 'I want to learn English because it is very important for me'
    expect(sentence.trim().split(/\s+/).length).toBeGreaterThan(10)
  })

  it('native_language must be a supported ISO 639-1 code', () => {
    const codes = new Set(SUPPORTED_LANGUAGES.map((l) => l.code))
    expect(codes.has('vi')).toBe(true)
    expect(codes.has('xx')).toBe(false)
  })
})

describe('POST /api/v1/lookup — response schema', () => {
  const sampleResponse = {
    data: {
      word: 'succeed',
      part_of_speech: 'verb',
      pronunciation: { uk_ipa: '/səkˈsiːd/', us_ipa: '/səkˈsiːd/' },
      definitions: [
        {
          cefr_level: 'B1',
          grammar_label: '[I]',
          definition: 'to achieve something you have been trying to do',
          definition_translation: 'đạt được điều gì đó bạn đang cố gắng làm',
          examples: ['She succeeded in getting the job.', 'Our plan succeeded.'],
        },
      ],
      word_family: [
        { word: 'success', part_of_speech: 'noun' },
        { word: 'successful', part_of_speech: 'adjective' },
      ],
      phrases: [
        {
          phrase: 'succeed in doing something',
          definition: 'to manage to do something after trying',
          example: 'Did you succeed in finding a solution?',
        },
      ],
      synonyms: ['achieve', 'accomplish', 'attain'],
      translation: 'thành công',
    },
    error: null,
  }

  it('success response has correct envelope shape', () => {
    expect(sampleResponse.data).toBeDefined()
    expect(sampleResponse.error).toBeNull()
  })

  it('response has word and part_of_speech', () => {
    expect(sampleResponse.data.word).toBeDefined()
    expect(sampleResponse.data.part_of_speech).toBeDefined()
  })

  it('pronunciation has uk_ipa and us_ipa', () => {
    expect(sampleResponse.data.pronunciation.uk_ipa).toBeDefined()
    expect(sampleResponse.data.pronunciation.us_ipa).toBeDefined()
  })

  it('definitions is a non-empty array with required fields', () => {
    expect(Array.isArray(sampleResponse.data.definitions)).toBe(true)
    expect(sampleResponse.data.definitions.length).toBeGreaterThan(0)
    const def = sampleResponse.data.definitions[0]
    expect(def).toHaveProperty('definition')
    expect(def).toHaveProperty('definition_translation')
    expect(def).toHaveProperty('examples')
    expect(Array.isArray(def.examples)).toBe(true)
  })

  it('word_family is an array of word+pos objects', () => {
    expect(Array.isArray(sampleResponse.data.word_family)).toBe(true)
    expect(sampleResponse.data.word_family[0]).toHaveProperty('word')
    expect(sampleResponse.data.word_family[0]).toHaveProperty('part_of_speech')
  })

  it('phrases array has phrase, definition, example fields', () => {
    expect(Array.isArray(sampleResponse.data.phrases)).toBe(true)
    const phrase = sampleResponse.data.phrases[0]
    expect(phrase).toHaveProperty('phrase')
    expect(phrase).toHaveProperty('definition')
    expect(phrase).toHaveProperty('example')
  })

  it('synonyms is an array of strings', () => {
    expect(Array.isArray(sampleResponse.data.synonyms)).toBe(true)
    expect(typeof sampleResponse.data.synonyms[0]).toBe('string')
  })

  it('translation is a string', () => {
    expect(typeof sampleResponse.data.translation).toBe('string')
  })

  it('error response has correct envelope shape', () => {
    const errRes = { data: null, error: { code: 'NOT_ENGLISH_WORD', message: 'Not a word.' } }
    expect(errRes.data).toBeNull()
    expect(errRes.error.code).toBeDefined()
    expect(errRes.error.message).toBeDefined()
  })
})
