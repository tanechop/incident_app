import test from 'node:test'
import assert from 'node:assert/strict'
import { createPrioritizer } from '../services/ai.service.js'

const silent = { error() {} }
const reply = (obj, status = 200) => async () => ({
  ok: status === 200,
  status,
  json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }),
})
const ticket = { title: 'Server down', description: 'Nobody can log in', category: 'Network', requested: 'low' }

test('returns the priority and the reason given by Gemini', async () => {
  const p = createPrioritizer({ apiKey: 'k', fetchImpl: reply({ priority: 'high', reason: 'Nobody can log in' }), log: silent })
  assert.deepEqual(await p.prioritize(ticket), { priority: 'high', reason: 'Nobody can log in' })
})

test('calls the right model, sends the key in a header and the ticket as data', async () => {
  let call
  const p = createPrioritizer({
    apiKey: 'secret', model: 'gemini-test', log: silent,
    fetchImpl: async (url, init) => { call = { url, init }; return reply({ priority: 'low', reason: 'x' })() },
  })
  await p.prioritize(ticket)
  assert.ok(call.url.endsWith('/models/gemini-test:generateContent'))
  assert.ok(!call.url.includes('secret'), 'the key must not be in the URL')
  assert.equal(call.init.headers['x-goog-api-key'], 'secret')
  const body = JSON.parse(call.init.body)
  assert.equal(body.generationConfig.responseMimeType, 'application/json')
  const sent = JSON.parse(body.contents[0].parts[0].text)
  assert.deepEqual(sent, { title: 'Server down', description: 'Nobody can log in', category: 'Network', requester_suggested_priority: 'low' })
  assert.ok(!body.systemInstruction.parts[0].text.includes('Nobody can log in'))
})

test('long texts are cut before they are sent', async () => {
  let body
  const p = createPrioritizer({
    apiKey: 'k', log: silent,
    fetchImpl: async (u, init) => { body = JSON.parse(init.body); return reply({ priority: 'low', reason: 'x' })() },
  })
  await p.prioritize({ ...ticket, description: 'a'.repeat(5000) })
  assert.equal(JSON.parse(body.contents[0].parts[0].text).description.length, 2000)
})

test('without an API key it is off and never calls Gemini', async () => {
  let called = false
  const p = createPrioritizer({ apiKey: '', fetchImpl: async () => { called = true }, log: silent })
  assert.equal(p.enabled, false)
  assert.equal(await p.prioritize(ticket), null)
  assert.equal(called, false)
})

test('an invalid priority, an HTTP error or a network error gives null', async () => {
  const bad = createPrioritizer({ apiKey: 'k', fetchImpl: reply({ priority: 'urgent', reason: 'x' }), log: silent })
  assert.equal(await bad.prioritize(ticket), null)
  const http = createPrioritizer({ apiKey: 'k', fetchImpl: reply({}, 500), log: silent })
  assert.equal(await http.prioritize(ticket), null)
  const net = createPrioritizer({ apiKey: 'k', fetchImpl: async () => { throw new Error('offline') }, log: silent })
  assert.equal(await net.prioritize(ticket), null)
  const junk = createPrioritizer({
    apiKey: 'k', log: silent,
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }) }),
  })
  assert.equal(await junk.prioritize(ticket), null)
})

test('a slow Gemini is stopped after the timeout', async () => {
  const p = createPrioritizer({
    apiKey: 'k', timeoutMs: 20, log: silent,
    fetchImpl: (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))),
  })
  assert.equal(await p.prioritize(ticket), null)
})

test('JSON wrapped in a code fence is still understood and the reason is limited', async () => {
  const p = createPrioritizer({
    apiKey: 'k', log: silent,
    fetchImpl: async () => ({
      ok: true, status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '```json\n{"priority":"medium","reason":"' + 'r'.repeat(500) + '"}\n```' }] } }] }),
    }),
  })
  const out = await p.prioritize(ticket)
  assert.equal(out.priority, 'medium')
  assert.equal(out.reason.length, 200)
})

test('check() tells the admin if the connection works and why not', async () => {
  const ok = createPrioritizer({ apiKey: 'k', fetchImpl: reply({ priority: 'high', reason: 'Everyone is blocked' }), log: silent })
  assert.deepEqual(await ok.check(), { ok: true, priority: 'high', reason: 'Everyone is blocked' })

  const badKey = createPrioritizer({ apiKey: 'k', fetchImpl: reply({}, 403), log: silent })
  assert.match((await badKey.check()).error, /not valid/)
  const noModel = createPrioritizer({ apiKey: 'k', fetchImpl: reply({}, 404), log: silent })
  assert.match((await noModel.check()).error, /Model not found/)
  const quota = createPrioritizer({ apiKey: 'k', fetchImpl: reply({}, 429), log: silent })
  assert.match((await quota.check()).error, /quota/)
  const offline = createPrioritizer({ apiKey: 'k', fetchImpl: async () => { throw new TypeError('fetch failed') }, log: silent })
  assert.match((await offline.check()).error, /Cannot reach Gemini/)
  const none = createPrioritizer({ apiKey: '', log: silent })
  assert.deepEqual(await none.check(), { ok: false, error: 'No API key.' })
})
