export const translateRequestSchema = {
  type: 'object',
  required: ['text', 'target_language'],
  properties: {
    text: { type: 'string', minLength: 1, maxLength: 5000 },
    target_language: { type: 'string', minLength: 2, maxLength: 10 },
    source_language: { type: 'string', minLength: 2, maxLength: 10 },
  },
  additionalProperties: false,
} as const

export const translateResponseSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        translated_text: { type: 'string' },
        source_language: { type: 'string' },
        target_language: { type: 'string' },
        original_text: { type: 'string' },
      },
    },
    error: {},
  },
} as const
