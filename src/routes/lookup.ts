import type { FastifyInstance } from 'fastify'
import { lookupRequestSchema } from '../schemas/lookup.js'
import { LookupService, LookupError } from '../services/lookup.js'
import { isSupported } from '../services/languages.js'
import { success, failure } from '../schemas/envelope.js'
import { verifyAuth } from '../plugins/auth.js'

export async function lookupRoute(app: FastifyInstance, lookupService: LookupService): Promise<void> {
  app.post('/lookup', {
    schema: { body: lookupRequestSchema },
    preHandler: [verifyAuth],
  }, async (request, reply) => {
    const { word, native_language } = request.body as { word: string; native_language: string }

    const trimmedWord = word.trim()
    if (!trimmedWord) {
      return reply.status(400).send(failure('INVALID_INPUT', "The 'word' field is required and must not be empty."))
    }

    const wordCount = trimmedWord.split(/\s+/).length
    if (wordCount > 10) {
      return reply.status(422).send(failure('INPUT_TOO_LONG', 'Please look up individual words or short phrases, not full sentences. Use POST /api/v1/translate for sentence translation.'))
    }

    if (!isSupported(native_language)) {
      return reply.status(422).send(failure('UNSUPPORTED_LANGUAGE', `Language code '${native_language}' is not supported. See GET /api/v1/languages for the full list.`))
    }

    try {
      const result = await lookupService.lookup(trimmedWord, native_language)
      return reply.status(200).send(success(result))
    } catch (err) {
      if (err instanceof LookupError) {
        const status = err.code === 'PROVIDER_UNAVAILABLE' ? 503 : 422
        return reply.status(status).send(failure(err.code, err.message))
      }
      app.log.error(err)
      return reply.status(500).send(failure('INTERNAL_ERROR', 'An unexpected error occurred.'))
    }
  })
}
