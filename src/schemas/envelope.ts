export const successSchema = {
  type: 'object',
  properties: {
    data: {},
    error: { type: 'null' },
  },
  required: ['data', 'error'],
} as const

export const errorSchema = {
  type: 'object',
  properties: {
    data: { type: 'null' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['data', 'error'],
} as const

export function success<T>(data: T): { data: T; error: null } {
  return { data, error: null }
}

export function failure(code: string, message: string): { data: null; error: { code: string; message: string } } {
  return { data: null, error: { code, message } }
}
