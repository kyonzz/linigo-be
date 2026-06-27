# Quickstart Validation Guide: AI Translation & Dictionary Service

## Prerequisites

- Node.js 20+ installed
- `GEMINI_API_KEY` set in `.env` — get free key at https://aistudio.google.com/app/apikey
- `npm install` completed

## Start the Server

```bash
npm run dev
# Server at http://localhost:3000
```

---

## Validate: Health Check

```bash
curl http://localhost:3000/api/v1/health
```
Expected: `{ "data": { "status": "ok" }, "error": null }`

---

## Validate: Dictionary Lookup (English Learner)

### Word lookup — "succeed" for a Vietnamese learner

```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "succeed", "native_language": "vi"}'
```

**Expected** (`data` object):
- `word`: `"succeed"`
- `part_of_speech`: `"verb"`
- `pronunciation.uk_ipa`: `/səkˈsiːd/` (or similar)
- `definitions`: array with ≥ 2 entries, each having `cefr_level`, `grammar_label`, `definition`, `definition_translation`, `examples`
- `word_family`: includes `success`, `successful`, `successfully`
- `phrases`: includes at least `"succeed in doing something"`
- `synonyms`: 3–5 words
- `translation`: Vietnamese translation of "succeed"
- `error`: `null`

### Phrasal verb lookup

```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "give up", "native_language": "vi"}'
```

Expected: definitions for the phrasal verb "give up" with CEFR level, examples, and Vietnamese translations.

### Adjective lookup

```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "ambitious", "native_language": "fr"}'
```

Expected: adjective entry with grammar label `[before noun]` or similar, French translations.

---

## Validate: Error Cases for Lookup

**Empty word → 400**
```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "", "native_language": "vi"}'
```
Expected: `error.code` is `"INVALID_INPUT"`

**Full sentence (too long) → 422**
```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "I want to learn English because it is very important", "native_language": "vi"}'
```
Expected: `error.code` is `"INPUT_TOO_LONG"`, message suggests using `/translate`

**Non-English input → 422**
```bash
curl -X POST http://localhost:3000/api/v1/lookup \
  -H "Content-Type: application/json" \
  -d '{"word": "xin chào", "native_language": "en"}'
```
Expected: `error.code` is `"NOT_ENGLISH_WORD"`

---

## Validate: Sentence Translation (existing)

```bash
curl -X POST http://localhost:3000/api/v1/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?", "target_language": "vi"}'
```
Expected: Vietnamese translation in `data.translated_text`.

---

## Validate: Supported Languages

```bash
curl http://localhost:3000/api/v1/languages
```
Expected: ≥ 25 languages with `code` and `display_name`.

---

## Run Tests

```bash
npm test              # all tests
npm run test:unit     # unit (no API key needed)
npm run test:contract # contract shape tests
npm run test:int      # integration (mocked Gemini)
```

All tests green = feature complete.

---

## Model Switch

```bash
GEMINI_MODEL=gemini-2.5-flash npm run dev   # higher quality, 250 RPD
GEMINI_MODEL=gemini-2.5-flash-lite npm run dev  # default, 5000 RPD
```
