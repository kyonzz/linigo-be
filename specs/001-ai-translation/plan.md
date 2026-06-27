# Implementation Plan: AI Translation & Dictionary Service

**Branch**: `001-ai-translation` | **Date**: 2026-06-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ai-translation/spec.md`

## Summary

Backend REST service with two modes:
1. **Dictionary lookup** (`POST /api/v1/lookup`) — Cambridge Dictionary-style entry for English
   learners: CEFR level, grammar labels, plain-English definitions with native-language
   translation, example sentences, word family, phrasal verbs, and synonyms.
2. **Sentence translation** (`POST /api/v1/translate`) — general text translation (existing).

Both modes call Google Gemini (`gemini-2.5-flash-lite` by default). The lookup endpoint uses
a carefully engineered few-shot JSON prompt that models Cambridge Dictionary's learner-focused
structure. Stack: Node.js 20 + TypeScript 5 + Fastify v4.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5

**Primary Dependencies**: Fastify v4, @google/generative-ai, dotenv

**AI Model**: `gemini-2.5-flash-lite` (default, 5,000 RPD free); switch via `GEMINI_MODEL`

**Storage**: N/A — stateless

**Testing**: Vitest + Supertest

**Target Platform**: Linux server

**Project Type**: web-service (REST API)

**Performance Goals**: p95 ≤ 3 seconds for lookup responses

**Constraints**: Lookup input ≤ 10 words (word/phrase only); translation input ≤ 5,000 chars

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| **I. Code Quality** | Single responsibility per module; no dead code | ✅ Lookup service is separate from translation service |
| **II. Testing Standards** | TDD, ≥ 80% coverage, contract tests for every endpoint | ✅ New lookup endpoint gets contract + unit + integration tests |
| **III. API & UX Consistency** | Standard envelope, semantic HTTP codes, RESTful naming | ✅ `/lookup` follows same envelope as `/translate` |
| **IV. Performance Requirements** | p95 ≤ 200ms internal; AI latency bounded | ✅ No DB, no N+1; Gemini latency documented at ≤ 3s |

**Post-design re-check**: ✅ All gates pass.

## Gemini Prompt for English Learner Lookup

The prompt lives in `src/prompts/lookup.ts` and is the core of this feature.
It instructs Gemini to return a structured JSON entry modeled on Cambridge Dictionary:

```
You are an expert English dictionary for language learners, modeled after Cambridge Dictionary.

Given the word or phrase: "{word}"
Target learner language for translations/notes: "{nativeLanguage}" (ISO 639-1 code)

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "word": "<the word as given>",
  "part_of_speech": "<verb|noun|adjective|adverb|preposition|conjunction|pronoun|interjection>",
  "pronunciation": {
    "uk_ipa": "<IPA string for UK English>",
    "us_ipa": "<IPA string for US English>"
  },
  "definitions": [
    {
      "cefr_level": "<A1|A2|B1|B2|C1|C2 or null if unknown>",
      "grammar_label": "<[I]|[T]|[C]|[U]|[I or T]|[C or U] or null>",
      "definition": "<clear, plain-English definition suitable for a language learner>",
      "definition_translation": "<definition translated into {nativeLanguage}>",
      "examples": [
        "<natural example sentence using the word in context>",
        "<second example sentence>"
      ]
    }
  ],
  "word_family": [
    { "word": "<related word>", "part_of_speech": "<pos>" }
  ],
  "phrases": [
    {
      "phrase": "<phrasal verb or idiom>",
      "definition": "<plain-English definition>",
      "example": "<example sentence>"
    }
  ],
  "synonyms": ["<synonym1>", "<synonym2>"],
  "translation": "<direct translation of the word into {nativeLanguage}>"
}

Rules:
- definitions: include ALL common senses, ordered most common to least common
- cefr_level: assign carefully; A1=very basic, C2=near-native mastery
- examples: use realistic, natural sentences — not textbook clichés
- word_family: include 3–6 related forms
- phrases: include 2–4 of the most common phrasal verbs or idioms
- synonyms: list 3–5 near-synonyms
- If input is not a valid English word or phrase, return:
  {"error": "NOT_ENGLISH_WORD", "message": "The input is not a recognized English word or phrase."}
- If input contains more than 10 words, return:
  {"error": "INPUT_TOO_LONG", "message": "Please look up individual words or short phrases, not full sentences."}
```

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-translation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── translation-api.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/
│   └── index.ts
├── prompts/
│   └── lookup.ts          # Prompt builder — injects word + nativeLanguage
├── routes/
│   ├── translate.ts        # (existing)
│   ├── lookup.ts           # NEW: POST /api/v1/lookup
│   ├── languages.ts        # (existing)
│   └── health.ts           # (existing)
├── services/
│   ├── translation.ts      # (existing)
│   ├── lookup.ts           # NEW: calls Gemini with lookup prompt, parses response
│   └── languages.ts        # (existing)
├── schemas/
│   ├── translate.ts        # (existing)
│   ├── lookup.ts           # NEW: JSON Schema for lookup request/response
│   ├── languages.ts        # (existing)
│   └── envelope.ts         # (existing)
└── index.ts                # Register new /lookup route

tests/
├── contract/
│   ├── translate.contract.test.ts    # (existing)
│   └── lookup.contract.test.ts       # NEW
├── integration/
│   ├── translate.integration.test.ts # (existing)
│   └── lookup.integration.test.ts    # NEW
└── unit/
    ├── translation.service.test.ts   # (existing)
    ├── lookup.service.test.ts        # NEW
    └── languages.service.test.ts     # (existing)
```

**Structure Decision**: Single project. The lookup feature is additive — new files alongside
existing translate files.

## Complexity Tracking

> No violations — complexity tracking not required.
