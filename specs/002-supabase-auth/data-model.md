# Data Model: Supabase Authentication Guard

This feature is stateless — no new database entities are introduced.

## Runtime Data: Decoded JWT Payload

The `verifyAuth` plugin decodes and attaches the JWT payload to `request.user` after
successful verification. This is in-memory only; nothing is persisted.

**Fields available on `request.user`** (standard Supabase JWT claims):

| Field | Type | Description |
|-------|------|-------------|
| `sub` | `string` | Supabase user UUID |
| `email` | `string \| undefined` | User's email address (if present) |
| `role` | `string` | Supabase role (`authenticated`) |
| `aud` | `string` | Audience (`authenticated`) |
| `exp` | `number` | Expiry timestamp (Unix seconds) |
| `iat` | `number` | Issued-at timestamp (Unix seconds) |

**TypeScript augmentation** required on `FastifyRequest` to expose `user`:

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload  // from 'jose'
  }
}
```

## Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_JWT_SECRET` | Yes | HS256 signing secret from Supabase dashboard → Project Settings → API |

Added to `src/config/index.ts` using the existing `require()` helper (crashes at boot if absent).
