import { GoogleGenerativeAI } from '@google/generative-ai'
import { withRetry } from '../utils/retry.js'

export class TranslationError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'TranslationError'
  }
}

export interface TranslationResult {
  translated_text: string
  source_language: string
  target_language: string
  original_text: string
}

interface GeminiTranslationResponse {
  translated_text: string
  detected_source_language: string | null
}

type GenerativeModel = ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>

export class TranslationService {
  private model: GenerativeModel

  constructor(model: GenerativeModel) {
    this.model = model
  }

  static create(apiKey: string, modelName: string): TranslationService {
    const client = new GoogleGenerativeAI(apiKey)
    return new TranslationService(client.getGenerativeModel({ model: modelName }))
  }

  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult> {
    const detectInstruction = sourceLanguage
      ? `The source language is "${sourceLanguage}".`
      : 'Detect the source language automatically and include the ISO 639-1 code in detected_source_language.'

    const prompt = `You are a translation service. Translate the following text to "${targetLanguage}" (ISO 639-1 code).
${detectInstruction}

Respond ONLY with a JSON object in this exact format:
{"translated_text": "<translation>", "detected_source_language": "<iso-639-1-code or null if detection failed>"}

Text to translate:
${text}`

    let raw: string
    try {
      const result = await withRetry(() => this.model.generateContent(prompt))
      raw = result.response.text().trim()
    } catch {
      throw new TranslationError('PROVIDER_UNAVAILABLE', 'The translation service is temporarily unavailable. Please retry after 30 seconds.')
    }

    let parsed: GeminiTranslationResponse
    try {
      const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
      parsed = JSON.parse(jsonStr) as GeminiTranslationResponse
    } catch {
      throw new TranslationError('PROVIDER_UNAVAILABLE', 'The translation service returned an unexpected response.')
    }

    const detectedLang = parsed.detected_source_language
    if (!detectedLang) {
      throw new TranslationError('DETECTION_FAILED', "Could not detect the source language. Please provide 'source_language' explicitly.")
    }

    return {
      translated_text: parsed.translated_text,
      source_language: sourceLanguage ?? detectedLang,
      target_language: targetLanguage,
      original_text: text,
    }
  }
}
