import { describe, it, expect, vi, afterEach } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/index.js'

const mockJwtVerify = vi.hoisted(() => vi.fn())

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: mockJwtVerify,
}))

vi.mock('../../src/config/index.js', () => ({
  config: {
    port: 3001,
    geminiApiKey: 'test-key',
    geminiModel: 'gemini-2.5-flash-lite',
    supabaseUrl: 'https://test.supabase.co',
  },
}))

function mockValidAuth() {
  mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'user-123', role: 'authenticated' } })
}

describe('Auth guard — protected endpoints', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app.close()
    vi.clearAllMocks()
  })

  it('POST /api/v1/translate returns 401 with no token', async () => {
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .send({ text: 'Hello', target_language: 'vi' })

    expect(res.status).toBe(401)
    expect(res.body.data).toBeNull()
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('POST /api/v1/translate returns 401 with invalid token', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('invalid'))
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Bearer bad.token.here')
      .send({ text: 'Hello', target_language: 'vi' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('POST /api/v1/translate returns 401 with wrong scheme', async () => {
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Basic dXNlcjpwYXNz')
      .send({ text: 'Hello', target_language: 'vi' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('POST /api/v1/lookup returns 401 with no token', async () => {
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .send({ word: 'run', native_language: 'vi' })

    expect(res.status).toBe(401)
    expect(res.body.data).toBeNull()
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('POST /api/v1/lookup returns 401 with invalid token', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('invalid'))
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer bad.token')
      .send({ word: 'run', native_language: 'vi' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('Auth guard — public endpoints', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app.close()
  })

  it('GET /api/v1/health returns 200 with no token', async () => {
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server).get('/api/v1/health')
    expect(res.status).toBe(200)
  })

  it('GET /api/v1/languages returns 200 with no token', async () => {
    app = buildApp()
    await app.ready()

    const res = await supertest(app.server).get('/api/v1/languages')
    expect(res.status).toBe(200)
  })
})
