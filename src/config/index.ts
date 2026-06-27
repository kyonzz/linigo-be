import 'dotenv/config'

function require(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const config = {
  port: parseInt(process.env['PORT'] ?? '8080', 10),
  geminiApiKey: require('GEMINI_API_KEY'),
  geminiModel: process.env['GEMINI_MODEL'] ?? 'gemini-2.5-flash-lite',
  supabaseUrl: require('SUPABASE_URL'),
}
