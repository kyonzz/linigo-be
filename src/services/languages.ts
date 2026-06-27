export interface SupportedLanguage {
  code: string
  display_name: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', display_name: 'English' },
  { code: 'es', display_name: 'Spanish' },
  { code: 'fr', display_name: 'French' },
  { code: 'de', display_name: 'German' },
  { code: 'it', display_name: 'Italian' },
  { code: 'pt', display_name: 'Portuguese' },
  { code: 'nl', display_name: 'Dutch' },
  { code: 'ru', display_name: 'Russian' },
  { code: 'zh', display_name: 'Chinese (Simplified)' },
  { code: 'ja', display_name: 'Japanese' },
  { code: 'ko', display_name: 'Korean' },
  { code: 'ar', display_name: 'Arabic' },
  { code: 'hi', display_name: 'Hindi' },
  { code: 'tr', display_name: 'Turkish' },
  { code: 'pl', display_name: 'Polish' },
  { code: 'sv', display_name: 'Swedish' },
  { code: 'da', display_name: 'Danish' },
  { code: 'no', display_name: 'Norwegian' },
  { code: 'fi', display_name: 'Finnish' },
  { code: 'el', display_name: 'Greek' },
  { code: 'cs', display_name: 'Czech' },
  { code: 'ro', display_name: 'Romanian' },
  { code: 'hu', display_name: 'Hungarian' },
  { code: 'uk', display_name: 'Ukrainian' },
  { code: 'vi', display_name: 'Vietnamese' },
]

const LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code))

export function isSupported(code: string): boolean {
  return LANGUAGE_CODES.has(code)
}
