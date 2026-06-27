# linigo-be

AI-powered translation backend. Accepts text and a target language, returns the translation via Google Gemini.

## Setup

```bash
cp .env.example .env
# Add your GEMINI_API_KEY from https://aistudio.google.com/app/apikey
npm install
```

## Run

```bash
npm run dev       # development (ts-node)
npm run build     # compile TypeScript
npm start         # run compiled output
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/translate` | Translate text |
| GET | `/api/v1/languages` | List supported languages |
| GET | `/api/v1/health` | Health check |

## Example

```bash
curl -X POST http://localhost:3000/api/v1/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "target_language": "fr"}'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | required | Google AI Studio API key |
| `PORT` | `3000` | Server port |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Gemini model (5000 RPD free) |

Set `GEMINI_MODEL=gemini-2.5-flash` for higher quality (250 RPD free).

## Tests

```bash
npm test              # all tests
npm run test:unit     # unit tests (no API key needed)
npm run test:contract # contract tests
npm run test:int      # integration tests (no API key needed, uses mocks)
```
