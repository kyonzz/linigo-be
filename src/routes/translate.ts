import type { FastifyInstance } from 'fastify'
import { translateRequestSchema } from '../schemas/translate.js'
import { TranslationService, TranslationError } from '../services/translation.js'
import { isSupported } from '../services/languages.js'
import { success, failure } from '../schemas/envelope.js'
import { verifyAuth } from '../plugins/auth.js'

export async function translateRoute(app: FastifyInstance, translationService: TranslationService): Promise<void> {
  app.post('/translate', {
    schema: { body: translateRequestSchema },
    preHandler: [verifyAuth],
  }, async (request, reply) => {
    const { text, target_language, source_language } = request.body as {
      text: string
      target_language: string
      source_language?: string
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return reply.status(400).send(failure('INVALID_INPUT', "The 'text' field is required and must not be empty."))
    }

    if (trimmedText.length > 5000) {
      return reply.status(422).send(failure('TEXT_TOO_LONG', `Text exceeds the 5000-character limit. Submitted: ${trimmedText.length} characters.`))
    }

    if (!isSupported(target_language)) {
      return reply.status(422).send(failure('UNSUPPORTED_LANGUAGE', `Language code '${target_language}' is not supported. See GET /api/v1/languages for the full list.`))
    }

    if (source_language && !isSupported(source_language)) {
      return reply.status(422).send(failure('UNSUPPORTED_LANGUAGE', `Language code '${source_language}' is not supported. See GET /api/v1/languages for the full list.`))
    }

    if (source_language && source_language === target_language) {
      return reply.status(422).send(failure('SAME_LANGUAGE', 'Source and target language must be different.'))
    }

    try {
      const result = await translationService.translate(trimmedText, target_language, source_language)
      return reply.status(200).send(success(result))
    } catch (err) {
      if (err instanceof TranslationError) {
        const status = err.code === 'PROVIDER_UNAVAILABLE' ? 503 : 422
        return reply.status(status).send(failure(err.code, err.message))
      }
      app.log.error(err)
      return reply.status(500).send(failure('INTERNAL_ERROR', 'An unexpected error occurred.'))
    }
  })
}
