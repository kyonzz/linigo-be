import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { config } from '../config/index.js'
import { failure } from '../schemas/envelope.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload
  }
}

const JWKS = createRemoteJWKSet(
  new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`)
)

const UNAUTHORIZED = failure('UNAUTHORIZED', 'Authentication required. Provide a valid Bearer token.')

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return reply.status(401).send(UNAUTHORIZED)
  }

  const token = auth.slice(7).trim()
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${config.supabaseUrl}/auth/v1`,
    })
    if (payload.role !== 'authenticated') {
      return reply.status(401).send(UNAUTHORIZED)
    }
    request.user = payload
  } catch {
    return reply.status(401).send(UNAUTHORIZED)
  }
}
