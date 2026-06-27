export const languagesResponseSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              display_name: { type: 'string' },
            },
            required: ['code', 'display_name'],
          },
        },
      },
    },
    error: {},
  },
} as const
