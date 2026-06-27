# Tasks: Supabase Authentication Guard

**Input**: Design documents from `specs/002-supabase-auth/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/auth-api.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the JWT library and wire the new environment variable.

- [ ] T001 Install `jose` package (`npm install jose`) and verify it appears in `package.json`
- [ ] T002 Add `SUPABASE_JWT_SECRET` to `src/config/index.ts` using the existing `require()` helper (crash at boot if absent)
- [ ] T003 Add `SUPABASE_JWT_SECRET=` entry to `.env.example`
- [ ] T004 Create empty file `src/plugins/auth.ts` (establishes directory)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The auth plugin must exist and be registered before any route-level tasks can be tested.

**⚠️ CRITICAL**: Phases 3 and 4 cannot be verified until this phase is complete.

- [ ] T005 [P] Write failing contract tests for auth failures in `tests/contract/auth.contract.test.ts`:
  - `POST /api/v1/translate` with no token → `401` + `UNAUTHORIZED`
  - `POST /api/v1/translate` with malformed token → `401` + `UNAUTHORIZED`
  - `POST /api/v1/translate` with expired token → `401` + `UNAUTHORIZED`
  - `POST /api/v1/lookup` with no token → `401` + `UNAUTHORIZED`
- [ ] T006 [P] Write failing unit tests for the auth plugin in `tests/unit/auth.plugin.test.ts`:
  - missing Authorization header → throws `UNAUTHORIZED`
  - non-Bearer scheme → throws `UNAUTHORIZED`
  - malformed JWT → throws `UNAUTHORIZED`
  - expired JWT → throws `UNAUTHORIZED`
  - valid JWT → attaches `request.user` and calls `done()`
- [ ] T007 Implement `src/plugins/auth.ts`:
  - Export `verifyAuth(request, reply): Promise<void>` preHandler function
  - Extract `Authorization` header; reject non-`Bearer` schemes with `401`
  - Call `jose.jwtVerify(token, secret)` where `secret = new TextEncoder().encode(config.supabaseJwtSecret)`
  - On `JWTExpired` or any `jose` error → `reply.status(401).send(failure('UNAUTHORIZED', 'Authentication required. Provide a valid Bearer token.'))`
  - On success → assign decoded payload to `request.user`
  - Augment `FastifyRequest` with `user: JWTPayload` via module augmentation in the same file
- [ ] T008 Register `verifyAuth` as a `preHandler` on the `POST /translate` route in `src/routes/translate.ts`
- [ ] T009 Register `verifyAuth` as a `preHandler` on the `POST /lookup` route in `src/routes/lookup.ts`
- [ ] T010 Confirm T005 and T006 tests now pass (`npm test`)

**Checkpoint**: Auth plugin implemented and all auth-failure contract tests green.

---

## Phase 3: User Story 1 — Authenticated Request Succeeds (Priority: P1) 🎯 MVP

**Goal**: Valid Supabase JWT → request passes through to handler and returns `200` with result.

**Independent Test**: Send a locally-minted HS256 token (signed with `SUPABASE_JWT_SECRET`) to `POST /api/v1/translate`; expect `200 OK` and translation data.

- [ ] T011 [US1] Write failing integration test in `tests/integration/auth.integration.test.ts`:
  - Mint a valid HS256 JWT using `jose.SignJWT` signed with `config.supabaseJwtSecret`
  - `POST /api/v1/translate` with valid token → `200` + translation result
  - `POST /api/v1/lookup` with valid token → `200` + dictionary entry
- [ ] T012 [US1] Extend existing `tests/contract/translate.contract.test.ts` with a `401` scenario (no token) so the contract for the translate endpoint is fully documented
- [ ] T013 [US1] Extend existing `tests/contract/lookup.contract.test.ts` with a `401` scenario (no token)
- [ ] T014 [US1] Run `npm test` and confirm T011–T013 pass

**Checkpoint**: Authenticated requests succeed end-to-end; User Story 1 fully functional.

---

## Phase 4: User Story 2 — Unauthenticated Request Is Rejected (Priority: P1)

**Goal**: All token-failure paths return `401` with the standard error envelope.

**Note**: Core rejection logic was already built in Phase 2. This phase verifies all failure variants are covered and documented.

**Independent Test**: Hit any protected endpoint with (a) no header, (b) wrong scheme, (c) bad token, (d) expired token — all must return `401 UNAUTHORIZED`.

- [ ] T015 [US2] Verify `tests/contract/auth.contract.test.ts` (from T005) covers all four failure modes; add any missing scenarios
- [ ] T016 [US2] Add `Authorization: Basic xyz` (wrong scheme) test case to `tests/unit/auth.plugin.test.ts`
- [ ] T017 [US2] Run `npm test` — all scenarios must return `{ data: null, error: { code: "UNAUTHORIZED", ... } }`

**Checkpoint**: All rejection scenarios verified; contract tests document exact error shape.

---

## Phase 5: User Story 3 — Public Endpoints Remain Accessible (Priority: P2)

**Goal**: `GET /api/v1/health` and `GET /api/v1/languages` return `200` with no token.

**Independent Test**: Call both public endpoints with no `Authorization` header; expect `200 OK`.

- [ ] T018 [US3] Write or extend existing tests to assert `GET /api/v1/health` returns `200` with no token in `tests/contract/auth.contract.test.ts`
- [ ] T019 [US3] Write or extend existing tests to assert `GET /api/v1/languages` returns `200` with no token in `tests/contract/auth.contract.test.ts`
- [ ] T020 [US3] Confirm `src/routes/health.ts` and `src/routes/languages.ts` have no `verifyAuth` preHandler attached
- [ ] T021 [US3] Run `npm test` — public endpoint tests must pass

**Checkpoint**: Public endpoints verified; no regression on non-protected routes.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Update `.env.example` if not already done in T003; confirm the new variable has a comment explaining where to find the value (Supabase dashboard → Project Settings → API → JWT Secret)
- [ ] T023 Run full test suite (`npm test`) and confirm coverage ≥ 80% on new files (`src/plugins/auth.ts`)
- [ ] T024 Run `npm run build` (TypeScript compilation) — zero errors
- [ ] T025 Manual smoke test per `specs/002-supabase-auth/quickstart.md` scenarios 1–5

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks Phases 3–5
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2; can run in parallel with Phases 3–4
- **Phase 6 (Polish)**: Depends on Phases 3–5

### Within Phase 2

- T005 and T006 are parallel (different files)
- T007 depends on T001–T004
- T008 and T009 depend on T007 (parallel with each other)
- T010 depends on T008 and T009

### Parallel Opportunities

```
# Phase 2 test writing (parallel):
T005: tests/contract/auth.contract.test.ts
T006: tests/unit/auth.plugin.test.ts

# Phase 3–5 (parallel after Phase 2):
T011–T014: US1 authenticated success
T015–T017: US2 rejection coverage
T018–T021: US3 public endpoint verification
```

---

## Implementation Strategy

### MVP (Phase 1 + 2 + 3 only)

1. Install `jose`, add env var → Phase 1
2. Write failing tests, implement plugin, wire to routes → Phase 2
3. Verify authenticated requests succeed → Phase 3
4. **STOP and VALIDATE** — the guard is live and the happy path works

### Full Delivery

1. MVP above
2. Phase 4: Confirm all rejection paths are tested and documented
3. Phase 5: Confirm public endpoints have no regression
4. Phase 6: Polish, compile check, smoke test

---

## Notes

- TDD order: write failing tests (T005, T006) → implement (T007–T009) → green (T010)
- `jose.jwtVerify` handles expiry automatically — no manual `exp` check needed
- Do not add `verifyAuth` to `health.ts` or `languages.ts` — absence is the intended behavior, verified in Phase 5
- Token minting for tests: see `specs/002-supabase-auth/quickstart.md` for the `SignJWT` snippet
