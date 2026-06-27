# Quickstart & Validation Guide: Supabase Authentication Guard

## Prerequisites

1. A running Supabase project with at least one user account.
2. `SUPABASE_JWT_SECRET` from Supabase dashboard → Project Settings → API → JWT Secret.
3. A valid Supabase access token (sign in via Supabase client or dashboard).
4. Node.js 20 + dependencies installed (`npm install`).

## Environment Setup

Add to `.env`:
```
SUPABASE_JWT_SECRET=<your-jwt-secret>
```

The existing `GEMINI_API_KEY` and `PORT` remain required.

## Start the Server

```bash
npm run dev
```

Expected log output: server listening on configured port, no startup errors.

---

## Validation Scenarios

### 1. Authenticated request succeeds

```bash
curl -s -X POST http://localhost:3000/api/v1/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-supabase-access-token>" \
  -d '{"text":"Hello","target_language":"vi"}' | jq .
```

**Expected**: `200 OK` with translation result in `data`.

---

### 2. No token → 401

```bash
curl -s -X POST http://localhost:3000/api/v1/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","target_language":"vi"}' | jq .
```

**Expected**:
```json
{ "data": null, "error": { "code": "UNAUTHORIZED", "message": "..." } }
```
HTTP status: `401`.

---

### 3. Invalid token → 401

```bash
curl -s -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer thisisnotavalidtoken" \
  -d '{"word":"run","native_language":"vi"}' | jq .
```

**Expected**: `401` with `UNAUTHORIZED`.

---

### 4. Health endpoint stays public

```bash
curl -s http://localhost:3000/api/v1/health | jq .
```

**Expected**: `200 OK` — no token required.

---

### 5. Languages endpoint stays public

```bash
curl -s http://localhost:3000/api/v1/languages | jq .
```

**Expected**: `200 OK` — no token required.

---

## Run Tests

```bash
npm test
```

All unit, contract, and integration tests must pass. Coverage ≥ 80% on new code.

## Obtaining a Test JWT

For integration tests, generate a signed HS256 token locally using the `SUPABASE_JWT_SECRET`:

```typescript
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
const token = await new SignJWT({ sub: 'test-user-id', role: 'authenticated', aud: 'authenticated' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(secret)
```

This token is indistinguishable from a real Supabase token from the server's perspective.
See [contracts/auth-api.md](contracts/auth-api.md) for the full response shape reference.
