# API Contract: AI Translation & Dictionary Service

**Base path**: `/api/v1`

**Response envelope**:
- Success: `{ "data": <payload>, "error": null }`
- Failure: `{ "data": null, "error": { "code": "...", "message": "..." } }`

**Content-Type**: `application/json`

---

## POST /api/v1/lookup *(new — English learner dictionary)*

Look up an English word or short phrase with full Cambridge-style dictionary data.

### Request Body

```json
{
  "word": "succeed",
  "native_language": "vi"
}
```

| Field             | Type   | Required | Notes                                         |
|-------------------|--------|----------|-----------------------------------------------|
| `word`            | string | Yes      | 1–100 chars, 1–10 words                       |
| `native_language` | string | Yes      | ISO 639-1 code (learner's native language)    |

### Success Response — `200 OK`

```json
{
  "data": {
    "word": "succeed",
    "part_of_speech": "verb",
    "pronunciation": {
      "uk_ipa": "/səkˈsiːd/",
      "us_ipa": "/səkˈsiːd/"
    },
    "definitions": [
      {
        "cefr_level": "B1",
        "grammar_label": "[I]",
        "definition": "to achieve something that you have been trying to do or get",
        "definition_translation": "đạt được điều gì đó mà bạn đang cố gắng làm hoặc có được",
        "examples": [
          "She succeeded in getting the job despite having little experience.",
          "Our plan succeeded beyond our expectations.",
          "I tried many times before I finally succeeded."
        ]
      },
      {
        "cefr_level": "B2",
        "grammar_label": "[I]",
        "definition": "to come after and take the place of someone or something",
        "definition_translation": "kế tiếp và đảm nhận vị trí của ai đó hoặc điều gì đó",
        "examples": [
          "She succeeded her father as head of the company.",
          "He was succeeded as president by his vice-president."
        ]
      }
    ],
    "word_family": [
      { "word": "success", "part_of_speech": "noun" },
      { "word": "successful", "part_of_speech": "adjective" },
      { "word": "successfully", "part_of_speech": "adverb" },
      { "word": "successive", "part_of_speech": "adjective" },
      { "word": "successor", "part_of_speech": "noun" }
    ],
    "phrases": [
      {
        "phrase": "succeed in doing something",
        "definition": "to manage to do something after trying",
        "example": "Did you succeed in finding a solution?"
      },
      {
        "phrase": "succeed to something",
        "definition": "to take a title, position, or property after the previous holder",
        "example": "She will succeed to the throne when the queen dies."
      }
    ],
    "synonyms": ["achieve", "accomplish", "attain", "prosper", "triumph"],
    "translation": "thành công"
  },
  "error": null
}
```

### Error Responses

**400 — Empty word**
```json
{
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "The 'word' field is required and must not be empty."
  }
}
```

**422 — Too many words (full sentence submitted)**
```json
{
  "data": null,
  "error": {
    "code": "INPUT_TOO_LONG",
    "message": "Please look up individual words or short phrases, not full sentences. Use POST /api/v1/translate for sentence translation."
  }
}
```

**422 — Not a recognized English word**
```json
{
  "data": null,
  "error": {
    "code": "NOT_ENGLISH_WORD",
    "message": "The input is not a recognized English word or phrase."
  }
}
```

**422 — Unsupported native language**
```json
{
  "data": null,
  "error": {
    "code": "UNSUPPORTED_LANGUAGE",
    "message": "Language code 'xx' is not supported. See GET /api/v1/languages for the full list."
  }
}
```

**503 — AI provider unavailable**
```json
{
  "data": null,
  "error": {
    "code": "PROVIDER_UNAVAILABLE",
    "message": "The service is temporarily unavailable. Please retry after 30 seconds."
  }
}
```

---

## POST /api/v1/translate *(existing — general sentence translation)*

Translate a word or sentence into a target language. See previous contract for full details.

### Request Body

```json
{
  "text": "Hello, how are you?",
  "target_language": "fr",
  "source_language": "en"
}
```

### Success Response — `200 OK`

```json
{
  "data": {
    "translated_text": "Bonjour, comment allez-vous ?",
    "source_language": "en",
    "target_language": "fr",
    "original_text": "Hello, how are you?"
  },
  "error": null
}
```

---

## GET /api/v1/languages *(existing — list supported languages)*

```json
{
  "data": {
    "languages": [
      { "code": "en", "display_name": "English" },
      { "code": "vi", "display_name": "Vietnamese" }
    ]
  },
  "error": null
}
```

---

## GET /api/v1/health *(existing)*

```json
{ "data": { "status": "ok" }, "error": null }
```
