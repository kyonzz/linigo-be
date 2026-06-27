# Implementation Plan: Supabase Authentication Guard

**Branch**: `002-supabase-auth` | **Date**: 2026-06-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-supabase-auth/spec.md`

## Summary

Add a Fastify preHandler that validates Supabase-issued JWTs (HS256, signed with the project
JWT secret) before every request to `POST /api/v1/translate` and `POST /api/v1/lookup`.
`GET /api/v1/health` and `GET /api/v1/languages` remain public. A single `auth` plugin
extracts the Bearer token, verifies it with `jose`, attaches the decoded payload to
`request.user`, and returns the standard error envelope on failure.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5

**Primary Dependencies**: Fastify v5, `jose` (JWT verification — lightweight, zero-dep, ESM-native); existing `dotenv`

**Storage**: N/A — stateless validation only

**Testing**: Vitest + Supertest

**Target Platform**: Linux server

**Project Type**: web-service (REST API)

**Performance Goals**: Auth check adds ≤ 50ms p95 overhead (SC-003)

**Constraints**: Fail-closed — if token cannot be verified, deny; never allow unauthenticated access silently

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| **I. Code Quality** | Single responsibility per module; no dead code | ✅ Auth logic lives in one `src/plugins/auth.ts` plugin; routes stay clean |
| **II. Testing Standards** | TDD, ≥ 80% coverage, contract tests for every endpoint | ✅ Auth unit tests + contract tests for 401/403 on protected routes; integration tests with real JWT |
| **III. API & UX Consistency** | Standard envelope on all errors; semantic HTTP codes | ✅ Auth failure → `401` with `{ data: null, error: { code: "UNAUTHORIZED", message: "..." } }` |
| **IV. Performance Requirements** | p95 ≤ 200ms internal; no N+1 | ✅ `jose.jwtVerify` is synchronous crypto — sub-millisecond; no DB calls in auth path |

**Post-design re-check**: ✅ All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-supabase-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── auth-api.md      # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── index.ts          # Add SUPABASE_JWT_SECRET
├── plugins/
│   └── auth.ts           # NEW: Fastify plugin — verifies Bearer JWT
├── routes/
│   ├── translate.ts      # Add preHandler: [verifyAuth]
│   ├── lookup.ts         # Add preHandler: [verifyAuth]
│   ├── languages.ts      # Unchanged (public)
│   └── health.ts         # Unchanged (public)
└── index.ts              # Register auth plugin

tests/
├── contract/
│   ├── translate.contract.test.ts   # Extend: 401 when no/bad token
│   ├── lookup.contract.test.ts      # Extend: 401 when no/bad token
│   └── auth.contract.test.ts        # NEW: auth guard contract
├── integration/
│   └── auth.integration.test.ts     # NEW: end-to-end with real JWT
└── unit/
    └── auth.plugin.test.ts          # NEW: unit test for plugin logic
```

**Structure Decision**: Single project — auth is additive middleware on existing routes.

## Complexity Tracking

> No violations — complexity tracking not required.
