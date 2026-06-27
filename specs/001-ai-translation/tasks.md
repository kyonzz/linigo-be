---

description: "Task list for AI Translation Service"
---

# Tasks: AI Translation Service

**Input**: Design documents from `specs/001-ai-translation/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested in spec — test tasks are included because the constitution mandates TDD (Principle II) and ≥ 80% coverage.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every task

## Path Conventions

- Source: `src/` at repository root
- Tests: `tests/` at repository root

---

## Phase 1: Setup

**Purpose**: Initialize the Node.js/TypeScript/Fastify project from scratch.

- [x] T001 Initialize Node.js project: `npm init -y` and create `package.json` with name `linigo-be`
- [x] T002 Install runtime dependencies: `npm install fastify @google/generative-ai dotenv`
- [x] T003 [P] Install dev dependencies: `npm install -D typescript @types/node vitest supertest @types/supertest ts-node`
- [x] T004 [P] Create `tsconfig.json` with strict mode, target ES2022, module NodeNext, outDir `dist/`
- [x] T005 [P] Add npm scripts to `package.json`: `dev` (ts-node src/index.ts), `build` (tsc), `test`, `test:unit`, `test:contract`, `test:int`
- [x] T006 [P] Create `vitest.config.ts` with separate test project configs for unit, contract, and integration test directories
- [x] T007 Create directory structure: `src/config/`, `src/routes/`, `src/services/`, `src/schemas/`, `tests/unit/`, `tests/contract/`, `tests/integration/`
- [x] T008 [P] Create `.env.example` with `GEMINI_API_KEY=`, `PORT=3000`, `GEMINI_MODEL=gemini-2.5-flash-lite`
- [x] T009 [P] Create `.gitignore` covering `node_modules/`, `dist/`, `.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story can be implemented.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T010 Create `src/config/index.ts` — reads and validates env vars (`GEMINI_API_KEY`, `PORT`, `GEMINI_MODEL`); throws on missing required values; defaults `GEMINI_MODEL` to `gemini-2.5-flash-lite`
- [x] T011 Create `src/index.ts` — Fastify server bootstrap: register routes, start listening on configured port, export `app` for testing
- [x] T012 [P] Create `src/schemas/envelope.ts` — shared JSON Schema definitions for the success envelope `{data, error: null}` and error envelope `{data: null, error: {code, message}}`
- [x] T013 [P] Create `src/services/languages.ts` — define the 25 supported languages constant (ISO 639-1 codes + display names); export `isSupported(code)` lookup function

**Checkpoint**: Server starts cleanly with `npm run dev`, GET /api/v1/health returns 200.

---

## Phase 3: User Story 1 — Translate Text via API (Priority: P1) 🎯 MVP

**Goal**: A caller submits text + target language and receives the translated text.

**Independent Test**: `curl -X POST http://localhost:3000/api/v1/translate -d '{"text":"Hello","target_language":"fr","source_language":"en"}'` returns a French translation.

### Tests for User Story 1 (TDD — write first, confirm FAIL before implementing)

- [x] T014 [P] [US1] Write contract test for POST /api/v1/translate request schema in `tests/contract/translate.contract.test.ts` — validates required fields, type constraints, length limits
- [x] T015 [P] [US1] Write contract test for POST /api/v1/translate response schema in `tests/contract/translate.contract.test.ts` — validates envelope format, required response fields
- [x] T016 [US1] Write unit tests for `TranslationService` in `tests/unit/translation.service.test.ts` — mock `@google/generative-ai` client; test successful translation, same-language passthrough, AI provider error handling
- [x] T017 [US1] Write integration test for POST /api/v1/translate happy path in `tests/integration/translate.integration.test.ts` — uses Supertest, mocks Anthropic SDK

### Implementation for User Story 1

- [x] T018 [P] [US1] Create `src/schemas/translate.ts` — JSON Schema for TranslationRequest (text, target_language, source_language) and TranslationResponse (translated_text, source_language, target_language, original_text)
- [x] T019 [US1] Create `src/services/translation.ts` — `TranslationService` class: `translate(text, targetLang, sourceLang?)` method; calls `@google/generative-ai` SDK using model from config; parses response; throws typed errors for provider failures
- [x] T020 [US1] Create `src/routes/translate.ts` — Fastify route for POST /api/v1/translate; validates request with schema from T018; calls TranslationService; formats success/error envelope; handles all error codes from data-model.md
- [x] T021 [US1] Register translate route in `src/index.ts` under prefix `/api/v1`
- [x] T022 [US1] Add input validation in `src/routes/translate.ts`: reject empty/whitespace-only text (INVALID_INPUT), enforce 5000-char limit (TEXT_TOO_LONG), validate target_language against supported list (UNSUPPORTED_LANGUAGE), reject same source+target (SAME_LANGUAGE)

**Checkpoint**: All T014–T017 tests pass. `curl` translate command returns correct French translation.

---

## Phase 4: User Story 2 — Detect Source Language Automatically (Priority: P2)

**Goal**: Caller omits `source_language`; service detects it and includes it in the response.

**Independent Test**: `curl -X POST http://localhost:3000/api/v1/translate -d '{"text":"Guten Morgen","target_language":"en"}'` returns `source_language: "de"` and English translation.

### Tests for User Story 2 (TDD — write first, confirm FAIL before implementing)

- [x] T023 [P] [US2] Write unit tests for auto-detection in `tests/unit/translation.service.test.ts` — mock AI returning detected language; test detection success and DETECTION_FAILED error path
- [x] T024 [US2] Write integration test for auto-detection in `tests/integration/translate.integration.test.ts` — request without source_language; verify `source_language` populated in response

### Implementation for User Story 2

- [x] T025 [US2] Update `src/services/translation.ts` — extend `translate()` to include language detection prompt when `source_language` is omitted; parse detected language from AI response; throw DETECTION_FAILED if detection confidence is insufficient
- [x] T026 [US2] Update `src/routes/translate.ts` — handle DETECTION_FAILED error code → return 422 with correct envelope

**Checkpoint**: All T023–T024 tests pass. Auto-detection works for all 25 supported languages.

---

## Phase 5: User Story 3 — List Supported Languages (Priority: P3)

**Goal**: Caller queries GET /api/v1/languages to discover all supported language codes and names.

**Independent Test**: `curl http://localhost:3000/api/v1/languages` returns array of ≥ 25 language objects each with `code` and `display_name`.

### Tests for User Story 3 (TDD — write first, confirm FAIL before implementing)

- [x] T027 [P] [US3] Write contract test for GET /api/v1/languages response in `tests/contract/languages.contract.test.ts` — validates envelope, array structure, required fields on each language object
- [x] T028 [US3] Write integration test for GET /api/v1/languages in `tests/integration/languages.integration.test.ts` — verifies count ≥ 25 and all required fields present

### Implementation for User Story 3

- [x] T029 [P] [US3] Create `src/schemas/languages.ts` — JSON Schema for LanguagesResponse (`{ languages: Array<{ code, display_name }> }`)
- [x] T030 [US3] Create `src/routes/languages.ts` — Fastify route for GET /api/v1/languages; reads from `languages.ts` service; returns full list in success envelope
- [x] T031 [US3] Register languages route in `src/index.ts` under prefix `/api/v1`

**Checkpoint**: All T027–T028 tests pass. Languages endpoint returns full list.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Health endpoint, error hardening, observability, and final validation.

- [x] T032 [P] Create `src/routes/health.ts` — GET /api/v1/health returns `{ data: { status: "ok" }, error: null }`; register in `src/index.ts`
- [x] T033 [P] Add global error handler to Fastify in `src/index.ts` — catches unhandled exceptions, logs internally, returns INTERNAL_ERROR envelope (never exposes stack traces)
- [x] T034 [P] Add request logging middleware to Fastify in `src/index.ts` — log method, path, status code, duration; no PII (no request body logging)
- [x] T035 Run full quickstart validation from `specs/001-ai-translation/quickstart.md` end-to-end — all curl commands return expected responses
- [x] T036 [P] Run `npm test` — confirm all tests green and coverage ≥ 80% on net-new code
- [x] T037 [P] Add `README.md` at repository root — setup instructions, env vars, run commands, endpoint summary

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — write tests first (T014–T017), then implement (T018–T022)
- **User Story 2 (Phase 4)**: Depends on Phase 2 — can start after Phase 3 checkpoint
- **User Story 3 (Phase 5)**: Depends on Phase 2 — can start in parallel with Phase 4
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Foundation only — no story dependencies
- **US2 (P2)**: Foundation only — independent of US1 (shares TranslationService but doesn't depend on US1 completion)
- **US3 (P3)**: Foundation only — completely independent of US1 and US2

### Within Each User Story

1. Tests MUST be written and confirmed FAILING before implementation begins
2. Schemas before routes
3. Services before routes
4. Routes before integration tests can run against real server

### Parallel Opportunities

- Phase 1: T003, T004, T005, T006, T008, T009 can all run in parallel after T001–T002
- Phase 2: T012, T013 can run in parallel after T010–T011
- Phase 3 tests: T014 and T015 can run in parallel
- Phase 3 implementation: T018 can run in parallel with test writing (T016–T017)
- Phase 5 and Phase 4 can run in parallel once Foundation is complete

---

## Parallel Example: User Story 1

```bash
# Write tests in parallel first:
Task T014: Contract test — translate request schema
Task T015: Contract test — translate response schema

# Confirm tests FAIL, then implement in parallel:
Task T018: Create src/schemas/translate.ts
Task T019: Create src/services/translation.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (translate endpoint)
4. **STOP and VALIDATE**: `curl` the translate endpoint — confirm French, Spanish, Japanese translations work
5. Ship/demo MVP

### Incremental Delivery

1. Setup + Foundational → project boots
2. User Story 1 → translate endpoint works → **MVP demo**
3. User Story 2 → auto-detection works → improved UX
4. User Story 3 → languages endpoint works → self-documenting API
5. Polish → health, logging, full test coverage → production-ready

---

## Notes

- [P] tasks = different files, safe to run in parallel
- [Story] label maps each task to its user story for traceability
- TDD is mandatory (Constitution Principle II) — never implement before writing a failing test
- Commit after each checkpoint (end of each Phase)
- Stop at each checkpoint to validate the story independently before proceeding
- The `@google/generative-ai` SDK MUST be mocked in unit and contract tests; only integration tests may call the real API (requires `GEMINI_API_KEY`)

---

## Phase 7: English Learner Dictionary Lookup — `POST /api/v1/lookup`

**Goal**: Cambridge Dictionary-style word lookup for English learners — CEFR level,
grammar labels, plain-English definitions with native-language translation, example
sentences, word family, phrasal verbs, and synonyms. All powered by a carefully
engineered Gemini prompt in `src/prompts/lookup.ts`.

**Independent Test**:
```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "succeed", "native_language": "vi"}'
```
Expected: `data.definitions[0].cefr_level` is `"B1"`, `data.word_family` includes `"success"`,
`data.phrases` includes a phrasal verb, `data.translation` is a Vietnamese word.

### Tests for Lookup (TDD — write first, confirm FAIL before implementing)

- [x] T038 [P] Write contract test for POST /api/v1/lookup request schema in `tests/contract/lookup.contract.test.ts` — validates required fields (`word`, `native_language`), max word count, character limit
- [x] T039 [P] Write contract test for POST /api/v1/lookup response schema in `tests/contract/lookup.contract.test.ts` — validates envelope, `definitions` array shape, `pronunciation` object, `word_family` array, `phrases` array
- [x] T040 Write unit tests for `LookupService` in `tests/unit/lookup.service.test.ts` — mock Gemini client; test: successful parse of full response, `NOT_ENGLISH_WORD` error handling, `INPUT_TOO_LONG` error from Gemini, malformed JSON from provider (PROVIDER_UNAVAILABLE)
- [x] T041 Write integration test for POST /api/v1/lookup in `tests/integration/lookup.integration.test.ts` — uses Supertest + mock `LookupService`; covers: 200 happy path, 400 empty word, 422 too many words, 422 unsupported native_language, 503 provider error

### Implementation

- [x] T042 [P] Create `src/prompts/lookup.ts` — exports `buildLookupPrompt(word: string, nativeLanguage: string): string`; contains the full Cambridge-style prompt template with all rules (CEFR levels, grammar labels, word family, phrases, synonyms, native-language translations, error JSON for invalid inputs)
- [x] T043 [P] Create `src/schemas/lookup.ts` — JSON Schema for `LookupRequest` (`word`: string 1–100 chars, `native_language`: string) and `LookupResponse` (full nested shape: `definitions`, `pronunciation`, `word_family`, `phrases`, `synonyms`, `translation`)
- [x] T044 Create `src/services/lookup.ts` — `LookupService` class accepting injected Gemini model; `lookup(word, nativeLanguage)` method: calls `buildLookupPrompt`, sends to Gemini, strips markdown fences, parses JSON; if Gemini returns `{"error": "NOT_ENGLISH_WORD", ...}` throws `LookupError('NOT_ENGLISH_WORD', ...)`; if `{"error": "INPUT_TOO_LONG", ...}` throws `LookupError('INPUT_TOO_LONG', ...)`; SDK failure throws `LookupError('PROVIDER_UNAVAILABLE', ...)`
- [x] T045 Create `src/routes/lookup.ts` — Fastify route for POST /api/v1/lookup; validates `word` non-empty (400 INVALID_INPUT), validates word count ≤ 10 (422 INPUT_TOO_LONG), validates `native_language` is supported (422 UNSUPPORTED_LANGUAGE); calls `LookupService.lookup()`; maps `LookupError` codes to correct HTTP status (NOT_ENGLISH_WORD → 422, INPUT_TOO_LONG → 422, PROVIDER_UNAVAILABLE → 503); returns success envelope
- [x] T046 Update `src/index.ts` — add `LookupService` instantiation using `TranslationService.create`-style pattern; pass to `lookupRoute`; register `lookupRoute` under `/api/v1` prefix
- [x] T047 Run full lookup quickstart validation from `specs/001-ai-translation/quickstart.md` — "succeed"/vi, "give up"/vi, "ambitious"/fr all return expected structure
- [x] T048 [P] Run `npm test` — confirm all tests (including new T038–T041 tests) are green

**Checkpoint**: `POST /api/v1/lookup` returns full Cambridge-style entry for any English word,
with definitions in the learner's native language, CEFR levels, grammar labels, and phrases.
