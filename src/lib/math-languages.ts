// The languages a math warm-up prompt is translated into for SEI students.
// Kept server-free so it can be imported on the client (the warm-up UI) too.
export const MATH_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ht', label: 'Kreyòl Ayisyen' },
] as const

export type MathLangCode = (typeof MATH_LANGUAGES)[number]['code']
