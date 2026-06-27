import { describe, it, expect, vi, beforeEach } from 'vitest'

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

function makeRequest(authHeader?: string) {
  return {
    headers: { authorization: authHeader },
    user: undefined as unknown,
  }
}

function makeReply() {
  const reply = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this },
    send(body: unknown) { this.body = body; return this },
  }
  return reply
}

describe('verifyAuth', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let verifyAuth: (req: any, reply: any) => Promise<void>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../src/plugins/auth.js')
    verifyAuth = mod.verifyAuth
  })

  it('returns UNAUTHORIZED when Authorization header is missing', async () => {
    const req = makeRequest(undefined)
    const reply = makeReply()
    await verifyAuth(req, reply)
    expect(reply.statusCode).toBe(401)
    expect((reply.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED')
  })

  it('returns UNAUTHORIZED when scheme is not Bearer', async () => {
    const req = makeRequest('Basic dXNlcjpwYXNz')
    const reply = makeReply()
    await verifyAuth(req, reply)
    expect(reply.statusCode).toBe(401)
    expect((reply.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED')
  })

  it('returns UNAUTHORIZED when jwtVerify throws', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('invalid token'))
    const req = makeRequest('Bearer not.a.real.jwt')
    const reply = makeReply()
    await verifyAuth(req, reply)
    expect(reply.statusCode).toBe(401)
    expect((reply.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED')
  })

  it('returns UNAUTHORIZED when role is not authenticated', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'anon-user', role: 'anon' } })
    const req = makeRequest('Bearer valid.looking.token')
    const reply = makeReply()
    await verifyAuth(req, reply)
    expect(reply.statusCode).toBe(401)
    expect((reply.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED')
  })

  it('attaches decoded payload to request.user on valid token', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'user-123', role: 'authenticated' } })
    const req = makeRequest('Bearer valid.jwt.token')
    const reply = makeReply()
    await verifyAuth(req, reply)
    expect(reply.statusCode).toBe(0)
    expect((req.user as { sub: string }).sub).toBe('user-123')
  })
})
