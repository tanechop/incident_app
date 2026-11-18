export const DEFAULT_MODEL = 'gemini-2.5-flash'

// Cleans and checks what the admin sends. Throws Error(message) for the admin to read.
// Returns only the fields that were sent.
export function normalizeAiInput(input = {}) {
  const out = {}

  if (input.enabled !== undefined) out.enabled = Boolean(input.enabled)

  if (input.apiKey !== undefined && input.apiKey !== null && String(input.apiKey).trim() !== '') {
    const key = String(input.apiKey).trim()
    if (/\s/.test(key) || key.length < 20 || key.length > 200) {
      throw new Error('This does not look like a Gemini API key. Copy it again from Google AI Studio.')
    }
    out.apiKey = key
  }
  if (input.clearKey) out.clearKey = true

  if (input.model !== undefined) {
    const model = String(input.model || '').trim() || DEFAULT_MODEL
    if (!/^[a-z0-9][a-z0-9._-]{2,59}$/i.test(model)) {
      throw new Error('The model name is not valid (example: gemini-2.5-flash).')
    }
    out.model = model
  }
  return out
}
