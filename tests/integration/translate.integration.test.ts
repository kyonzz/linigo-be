import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { TranslationService, TranslationError } from '../../src/services/translation.js'
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

function makeMockService(translateImpl: (...args: unknown[]) => unknown) {
  return { translate: vi.fn(translateImpl) } as unknown as TranslationService
}

describe('POST /api/v1/translate', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app.close()
    vi.clearAllMocks()
  })

  it('returns 200 with translation for valid request', async () => {
    mockValidAuth()
    const svc = makeMockService(async () => ({
      translated_text: 'Bonjour',
      source_language: 'en',
      target_language: 'fr',
      original_text: 'Hello',
    }))
    app = buildApp(svc)
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ text: 'Hello', target_language: 'fr', source_language: 'en' })

    expect(res.status).toBe(200)
    expect(res.body.data.translated_text).toBe('Bonjour')
    expect(res.body.data.source_language).toBe('en')
    expect(res.body.data.target_language).toBe('fr')
    expect(res.body.error).toBeNull()
  })

  it('returns 400 for empty text', async () => {
    mockValidAuth()
    app = buildApp(makeMockService(async () => ({})))
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ text: '   ', target_language: 'fr' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 422 for unsupported target language', async () => {
    mockValidAuth()
    app = buildApp(makeMockService(async () => ({})))
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ text: 'Hello', target_language: 'xx' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('UNSUPPORTED_LANGUAGE')
  })

  it('returns 422 when source and target language are same', async () => {
    mockValidAuth()
    app = buildApp(makeMockService(async () => ({})))
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ text: 'Hello', source_language: 'en', target_language: 'en' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('SAME_LANGUAGE')
  })

  it('returns 503 when AI provider is unavailable', async () => {
    mockValidAuth()
    const svc = makeMockService(async () => {
      throw new TranslationError('PROVIDER_UNAVAILABLE', 'Temporarily unavailable.')
    })
    app = buildApp(svc)
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/translate')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ text: 'Hello', target_language: 'fr', source_language: 'en' })

    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('PROVIDER_UNAVAILABLE')
  })
})

describe('GET /api/v1/languages', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = buildApp(makeMockService(async () => ({})))
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns list of supported languages', async () => {
    const res = await supertest(app.server).get('/api/v1/languages')

    expect(res.status).toBe(200)
    expect(res.body.error).toBeNull()
    expect(Array.isArray(res.body.data.languages)).toBe(true)
    expect(res.body.data.languages.length).toBeGreaterThanOrEqual(25)
    expect(res.body.data.languages[0]).toHaveProperty('code')
    expect(res.body.data.languages[0]).toHaveProperty('display_name')
  })
})

describe('GET /api/v1/health', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = buildApp(makeMockService(async () => ({})))
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns ok status', async () => {
    const res = await supertest(app.server).get('/api/v1/health')

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ok')
    expect(res.body.error).toBeNull()
  })
})
