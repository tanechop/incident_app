import { config } from '../config/env.js'
import { createPrioritizer } from './ai.service.js'
import { getAiConfig } from './settings.service.js'

// The prioritizer used by the app. It follows the settings of the admin page
// (key, model, on/off) and, when nothing is saved there, the values of .env.
export const prioritizer = {
  async prioritize(ticket) {
    const cfg = await getAiConfig()
    if (!cfg.enabled) return null
    return createPrioritizer({
      apiKey: cfg.apiKey,
      model: cfg.model,
      timeoutMs: config.gemini.timeoutMs,
    }).prioritize(ticket)
  },
}
