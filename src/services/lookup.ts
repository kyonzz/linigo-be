import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildLookupPrompt } from '../prompts/lookup.js'
import { withRetry } from '../utils/retry.js'

export class LookupError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'LookupError'
  }
}

export interface Definition {
  cefr_level: string | null
  grammar_label: string | null
  definition: string
  definition_translation: string
  examples: string[]
}

export interface Entry {
  part_of_speech: string
  definitions: Definition[]
  synonyms: string[]
  translation: string
}

export interface WordForm {
  word: string
  part_of_speech: string
}

export interface Phrase {
  phrase: string
  definition: string
  example: string
}

export interface LookupResult {
  word: string
  pronunciation: { uk_ipa: string; us_ipa: string }
  entries: Entry[]
  word_family: WordForm[]
  phrases: Phrase[]
}

type GenerativeModel = ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>

interface GeminiErrorResponse {
  error: string
  message: string
}

export class LookupService {
  private model: GenerativeModel

  constructor(model: GenerativeModel) {
    this.model = model
  }

  static create(apiKey: string, modelName: string): LookupService {
    const client = new GoogleGenerativeAI(apiKey)
    return new LookupService(client.getGenerativeModel({ model: modelName }))
  }

  async lookup(word: string, nativeLanguage: string): Promise<LookupResult> {
    const prompt = buildLookupPrompt(word, nativeLanguage)

    let raw: string
    try {
      const result = await withRetry(() => this.model.generateContent(prompt))
      raw = result.response.text().trim()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[LookupService] Gemini error:', msg)
      throw new LookupError('PROVIDER_UNAVAILABLE', 'The service is temporarily unavailable. Please retry after 30 seconds.')
    }

    let parsed: LookupResult | GeminiErrorResponse
    try {
      const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
      parsed = JSON.parse(jsonStr) as LookupResult | GeminiErrorResponse
    } catch {
      throw new LookupError('PROVIDER_UNAVAILABLE', 'The service returned an unexpected response.')
    }

    if ('error' in parsed) {
      const errCode = parsed.error === 'NOT_ENGLISH_WORD' ? 'NOT_ENGLISH_WORD' : 'INPUT_TOO_LONG'
      throw new LookupError(errCode, parsed.message)
    }

    return parsed
  }
}
