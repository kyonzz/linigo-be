export const lookupRequestSchema = {
  type: 'object',
  required: ['word', 'native_language'],
  properties: {
    word: { type: 'string', minLength: 1, maxLength: 100 },
    native_language: { type: 'string', minLength: 2, maxLength: 10 },
  },
  additionalProperties: false,
} as const
