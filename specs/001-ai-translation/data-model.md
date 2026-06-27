# Data Model: AI Translation & Dictionary Service

No persistent storage required. All entities are request/response shapes (runtime objects only).

---

## LookupRequest *(new)*

Input submitted by a caller to the dictionary lookup endpoint.

| Field             | Type   | Required | Constraints                                       |
|-------------------|--------|----------|---------------------------------------------------|
| `word`            | string | Yes      | 1–100 characters; 1–10 words; must not be whitespace-only |
| `native_language` | string | Yes      | ISO 639-1 code; must be in supported list         |

**Validation rules**:
- `word` stripped of whitespace must be non-empty
- `word` must contain ≤ 10 space-separated tokens (not a full sentence)
- `native_language` must be in the supported languages registry

---

## LookupResponse *(new)*

Full Cambridge-style dictionary entry returned on a successful lookup.

| Field                              | Type            | Description                                              |
|------------------------------------|-----------------|----------------------------------------------------------|
| `word`                             | string          | The word as submitted                                    |
| `part_of_speech`                   | string          | verb, noun, adjective, adverb, etc.                      |
| `pronunciation.uk_ipa`             | string          | UK English IPA notation (e.g. `/səkˈsiːd/`)             |
| `pronunciation.us_ipa`             | string          | US English IPA notation                                  |
| `definitions`                      | Definition[]    | All common senses, ordered most → least common           |
| `word_family`                      | WordForm[]      | Related word forms (noun, adjective, adverb variants)    |
| `phrases`                          | Phrase[]        | Common phrasal verbs and idioms containing the word      |
| `synonyms`                         | string[]        | 3–5 near-synonyms                                        |
| `translation`                      | string          | Direct translation of the word into native language      |

### Definition (nested)

| Field                  | Type        | Description                                                     |
|------------------------|-------------|-----------------------------------------------------------------|
| `cefr_level`           | string\|null | CEFR level: A1, A2, B1, B2, C1, C2, or null if ambiguous      |
| `grammar_label`        | string\|null | `[I]`, `[T]`, `[C]`, `[U]`, `[I or T]`, `[C or U]`, or null  |
| `definition`           | string      | Plain-English definition suitable for a language learner        |
| `definition_translation` | string    | Definition translated into the learner's native language        |
| `examples`             | string[]    | 2–3 natural example sentences in context                        |

### WordForm (nested)

| Field          | Type   | Description                      |
|----------------|--------|----------------------------------|
| `word`         | string | The related word form            |
| `part_of_speech` | string | Part of speech of the form      |

### Phrase (nested)

| Field       | Type   | Description                              |
|-------------|--------|------------------------------------------|
| `phrase`    | string | The phrasal verb or idiom                |
| `definition`| string | Plain-English definition                 |
| `example`   | string | One natural example sentence             |

---

## TranslationRequest *(existing, unchanged)*

| Field             | Type   | Required | Constraints                                  |
|-------------------|--------|----------|----------------------------------------------|
| `text`            | string | Yes      | 1–5,000 characters; must not be whitespace-only |
| `target_language` | string | Yes      | ISO 639-1 code; must be in supported list    |
| `source_language` | string | No       | ISO 639-1 code; auto-detected if omitted     |

---

## TranslationResponse *(existing, unchanged)*

| Field              | Type   | Description                                                |
|--------------------|--------|------------------------------------------------------------|
| `translated_text`  | string | The AI-generated translation                               |
| `source_language`  | string | Detected or provided source language                       |
| `target_language`  | string | Echoed from request                                        |
| `original_text`    | string | Original input text                                        |

---

## SupportedLanguage *(existing, unchanged)*

| Field          | Type   | Description                              |
|----------------|--------|------------------------------------------|
| `code`         | string | ISO 639-1 two-letter code                |
| `display_name` | string | Human-readable name in English           |

---

## ErrorResponse *(standard, unchanged)*

| Field          | Type   | Description                          |
|----------------|--------|--------------------------------------|
| `error.code`   | string | Machine-readable error code          |
| `error.message`| string | Human-readable description           |

**Error codes for `/lookup`**:

| Code                   | HTTP Status | Scenario                                              |
|------------------------|-------------|-------------------------------------------------------|
| `INVALID_INPUT`        | 400         | Empty word or missing required fields                 |
| `INPUT_TOO_LONG`       | 422         | More than 10 words submitted (use /translate instead) |
| `NOT_ENGLISH_WORD`     | 422         | Input is not a recognized English word or phrase      |
| `UNSUPPORTED_LANGUAGE` | 422         | native_language code not in supported list            |
| `PROVIDER_UNAVAILABLE` | 503         | AI provider returned an error or is unreachable       |
| `INTERNAL_ERROR`       | 500         | Unexpected server-side error                          |
