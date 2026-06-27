import type { FastifyInstance } from 'fastify'
import { success } from '../schemas/envelope.js'

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    return reply.status(200).send(success({ status: 'ok' }))
  })
}
