import { describe, it, expect, vi, afterEach } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { LookupService, LookupError } from '../../src/services/lookup.js'
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

const fullEntry = {
  word: 'succeed',
  part_of_speech: 'verb',
  pronunciation: { uk_ipa: '/səkˈsiːd/', us_ipa: '/səkˈsiːd/' },
  definitions: [
    {
      cefr_level: 'B1',
      grammar_label: '[I]',
      definition: 'to achieve something you have been trying to do',
      definition_translation: 'đạt được điều gì đó',
      examples: ['She succeeded in getting the job.', 'Our plan succeeded.'],
    },
  ],
  word_family: [{ word: 'success', part_of_speech: 'noun' }],
  phrases: [{ phrase: 'succeed in doing something', definition: 'to manage to do', example: 'Did you succeed?' }],
  synonyms: ['achieve', 'accomplish'],
  translation: 'thành công',
}

function makeMockLookup(impl: (...args: unknown[]) => unknown) {
  return { lookup: vi.fn(impl) } as unknown as LookupService
}

describe('POST /api/v1/lookup', () => {
  let app: FastifyInstance

  afterEach(async () => {
    await app.close()
    vi.clearAllMocks()
  })

  it('returns 200 with full dictionary entry for valid word', async () => {
    mockValidAuth()
    const svc = makeMockLookup(async () => fullEntry)
    app = buildApp(undefined, svc)
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ word: 'succeed', native_language: 'vi' })

    expect(res.status).toBe(200)
    expect(res.body.error).toBeNull()
    expect(res.body.data.word).toBe('succeed')
    expect(res.body.data.part_of_speech).toBe('verb')
    expect(Array.isArray(res.body.data.definitions)).toBe(true)
    expect(res.body.data.definitions[0].cefr_level).toBe('B1')
    expect(res.body.data.translation).toBe('thành công')
  })

  it('returns 400 for empty word', async () => {
    mockValidAuth()
    app = buildApp(undefined, makeMockLookup(async () => fullEntry))
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ word: '   ', native_language: 'vi' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 422 for sentence input (> 10 words)', async () => {
    mockValidAuth()
    app = buildApp(undefined, makeMockLookup(async () => fullEntry))
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ word: 'I want to learn English because it is very important for me', native_language: 'vi' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('INPUT_TOO_LONG')
  })

  it('returns 422 for unsupported native_language', async () => {
    mockValidAuth()
    app = buildApp(undefined, makeMockLookup(async () => fullEntry))
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ word: 'succeed', native_language: 'xx' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('UNSUPPORTED_LANGUAGE')
  })

  it('returns 422 for NOT_ENGLISH_WORD error from service', async () => {
    mockValidAuth()
    const svc = makeMockLookup(async () => {
      throw new LookupError('NOT_ENGLISH_WORD', 'Not a recognized English word.')
    })
    app = buildApp(undefined, svc)
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ word: 'xyzzy', native_language: 'vi' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('NOT_ENGLISH_WORD')
  })

  it('returns 503 when AI provider is unavailable', async () => {
    mockValidAuth()
    const svc = makeMockLookup(async () => {
      throw new LookupError('PROVIDER_UNAVAILABLE', 'Temporarily unavailable.')
    })
    app = buildApp(undefined, svc)
    await app.ready()

    const res = await supertest(app.server)
      .post('/api/v1/lookup')
      .set('Authorization', 'Bearer valid.jwt.token')
      .send({ word: 'succeed', native_language: 'vi' })

    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('PROVIDER_UNAVAILABLE')
  })
})
