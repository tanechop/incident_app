import { db } from '../config/db.js'
import { config } from '../config/env.js'
import HttpError from '../utils/HttpError.js'
import { createVault } from './vault.js'
import { createPrioritizer } from './ai.service.js'
import { DEFAULT_MODEL, normalizeAiInput } from './aiSettings.rules.js'

const vault = createVault(config.jwtSecret)
const CACHE_MS = 15000
let cache = null // { at, value }

async function readSettings() {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM app_settings')
  return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]))
}

async function writeSetting(key, value) {
  if (value === null) {
    await db.query('DELETE FROM app_settings WHERE setting_key = ?', [key])
  } else {
    await db.query(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    )
  }
}

// What the app really uses: the settings saved by the admin, else the .env values
export async function getAiConfig() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value

  let stored = {}
  try {
    stored = await readSettings()
  } catch (err) {
    console.error('Could not read the settings:', err.message)
  }

  const storedKey = stored.ai_api_key ? vault.decrypt(stored.ai_api_key) : null
  const apiKey = storedKey || config.gemini.apiKey || null
  const wanted = stored.ai_enabled === undefined ? Boolean(apiKey) : stored.ai_enabled === '1'

  const value = {
    enabled: wanted && Boolean(apiKey),
    wanted,
    apiKey,
    keySource: storedKey ? 'settings' : config.gemini.apiKey ? 'env' : null,
    model: stored.ai_model || config.gemini.model || DEFAULT_MODEL,
  }
  cache = { at: Date.now(), value }
  return value
}

export async function isAiEnabled() {
  return (await getAiConfig()).enabled
}

// What the admin page shows. The key itself is never sent, only its last 4 characters.
export async function getAiSettings() {
  const cfg = await getAiConfig()
  let aiTickets = 0
  let totalTickets = 0
  try {
    const [[r]] = await db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(priority_source = 'ai'), 0) AS ai FROM ticket`
    )
    aiTickets = Number(r.ai)
    totalTickets = Number(r.total)
  } catch {
    // the priority columns do not exist yet: show zero
  }
  return {
    enabled: cfg.wanted,
    active: cfg.enabled,
    hasKey: Boolean(cfg.apiKey),
    keyHint: cfg.apiKey ? cfg.apiKey.slice(-4) : null,
    keySource: cfg.keySource,
    model: cfg.model,
    aiTickets,
    totalTickets,
  }
}

export async function saveAiSettings(input) {
  let data
  try {
    data = normalizeAiInput(input)
  } catch (err) {
    throw new HttpError(400, err.message)
  }

  // Refuse before saving anything if the result would be "on" without a key
  const cfg = await getAiConfig()
  const willHaveKey = Boolean(data.apiKey) || (!data.clearKey && Boolean(cfg.apiKey))
  const willBeOn = data.enabled !== undefined ? data.enabled : cfg.wanted
  if (willBeOn && !willHaveKey) {
    throw new HttpError(400, 'Add an API key to turn AI priority on.')
  }

  if (data.apiKey) await writeSetting('ai_api_key', vault.encrypt(data.apiKey))
  if (data.clearKey) await writeSetting('ai_api_key', null)
  if (data.model !== undefined) await writeSetting('ai_model', data.model)
  if (data.enabled !== undefined) await writeSetting('ai_enabled', data.enabled ? '1' : '0')

  cache = null
  return getAiSettings()
}

// "Test connection": uses the key typed in the form, or the saved one
export async function testAiConnection({ apiKey, model } = {}) {
  const cfg = await getAiConfig()
  const key = apiKey?.trim() || cfg.apiKey
  if (!key) return { ok: false, error: 'Add an API key first.' }
  let cleanModel
  try {
    cleanModel = normalizeAiInput({ model: model || cfg.model }).model
  } catch (err) {
    return { ok: false, error: err.message }
  }
  return createPrioritizer({ apiKey: key, model: cleanModel, timeoutMs: 12000 }).check()
}
