# Research: AI Translation & Dictionary Service

## Language & Runtime

**Decision**: Node.js 20 LTS + TypeScript 5

**Rationale**: Unchanged from previous plan. See prior rationale.

---

## Web Framework

**Decision**: Fastify v4

**Rationale**: Unchanged. Schema-first validation, low overhead, excellent TypeScript support.

---

## AI Provider

**Decision**: Google Gemini API — model `gemini-2.5-flash-lite` (default, free tier)

**Free tier limits** (Google AI Studio, June 2026): 5,000 RPD, generous TPM.
Set `GEMINI_MODEL=gemini-2.5-flash` for higher quality (250 RPD).

---

## Prompt Design for English Learners

**Reference**: Cambridge Dictionary structure (https://dictionary.cambridge.org/)

Cambridge Dictionary is the gold standard for English learners because it provides:
- **CEFR level labels** (A1–C2) per definition — learners know if a word is within their level
- **Plain-English definitions** — clear, accessible, no circular definitions
- **Grammar labels** — `[I]` intransitive, `[T]` transitive, `[C]` countable, `[U]` uncountable
- **Contextual example sentences** — 2–3 natural sentences showing word in use
- **Word family** — related forms (success, successful, successfully)
- **Phrasal verbs / idioms** — succeed in doing, succeed to, etc.
- **UK and US pronunciation** (IPA notation)
- **Multiple definitions** when a word has different senses

### Prompt Architecture

The Gemini prompt MUST be structured to return all of the above in a single JSON response.
The prompt uses a **few-shot JSON template** approach: we show Gemini the exact output shape
expected and ask it to fill it in. This produces more consistent, parseable responses than
free-text prompts.

**Prompt template** (stored in `src/prompts/lookup.ts`):

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
- definitions: include ALL common senses, ordered from most common to least common
- cefr_level: assign carefully; A1 = very basic, C2 = near-native mastery
- examples: use realistic, natural sentences — not textbook clichés
- word_family: include 3–6 related forms
- phrases: include 2–4 of the most common phrasal verbs or idioms
- synonyms: list 3–5 near-synonyms
- If the input is not a valid English word or phrase, return:
  {"error": "NOT_ENGLISH_WORD", "message": "The input is not a recognized English word or phrase."}
- If the input contains more than 10 words, return:
  {"error": "INPUT_TOO_LONG", "message": "Please look up individual words or short phrases, not full sentences."}
```

**Why this prompt works best for English learners**:
1. CEFR levels let learners self-filter by their proficiency
2. Grammar labels (intransitive/transitive/countable) prevent common grammatical errors
3. Native-language translation of the definition removes ambiguity for beginners
4. Word family helps learners expand vocabulary systematically
5. Phrasal verbs are the hardest part of English — including them in one lookup adds high value
6. Few-shot JSON structure in the prompt consistently produces parseable output from Gemini

---

## Input Scope Change: Words and Short Phrases Only

**Decision**: The lookup endpoint accepts individual words and short phrases (≤ 10 words).
Full sentences are rejected with a helpful error.

**Rationale**: Cambridge Dictionary is a word/phrase dictionary, not a translator.
Full-sentence translation remains a separate endpoint (`/translate`). Mixing both in one
response would dilute the dictionary-quality output. The service now has two modes:
1. `POST /api/v1/lookup` — dictionary lookup for English learners (new)
2. `POST /api/v1/translate` — general sentence translation (existing)

---

## Native Language Support

**Decision**: The `native_language` field (ISO 639-1 code) is required for `/lookup`.

**Rationale**: English learners need definitions and translations in their native language.
Showing only an English definition to a beginner (A1/A2) defeats the purpose. Gemini
handles the translation inline within the same prompt, avoiding a second API call.

---

## Testing

**Decision**: Vitest + Supertest (unchanged)

---

## Project Structure

```
src/
├── config/
│   └── index.ts
├── prompts/
│   └── lookup.ts        # NEW: prompt template builder for dictionary lookup
├── routes/
│   ├── translate.ts
│   ├── lookup.ts        # NEW: POST /api/v1/lookup route
│   ├── languages.ts
│   └── health.ts
├── services/
│   ├── translation.ts
│   ├── lookup.ts        # NEW: dictionary lookup service
│   └── languages.ts
├── schemas/
│   ├── translate.ts
│   ├── lookup.ts        # NEW: JSON Schema for lookup request/response
│   ├── languages.ts
│   └── envelope.ts
└── index.ts

tests/
├── contract/
│   ├── translate.contract.test.ts
│   └── lookup.contract.test.ts     # NEW
├── integration/
│   ├── translate.integration.test.ts
│   └── lookup.integration.test.ts  # NEW
└── unit/
    ├── translation.service.test.ts
    ├── lookup.service.test.ts       # NEW
    └── languages.service.test.ts
```
