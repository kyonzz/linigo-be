import type { FastifyInstance } from 'fastify'
import { SUPPORTED_LANGUAGES } from '../services/languages.js'
import { success } from '../schemas/envelope.js'

export async function languagesRoute(app: FastifyInstance): Promise<void> {
  app.get('/languages', async (_request, reply) => {
    return reply.status(200).send(success({ languages: SUPPORTED_LANGUAGES }))
  })
}
