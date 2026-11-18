import test from 'node:test'
import assert from 'node:assert/strict'
import { createVault } from '../services/vault.js'
import { normalizeAiInput } from '../services/aiSettings.rules.js'

test('the vault gives back what was stored and hides it in between', () => {
  const vault = createVault('server-secret')
  const stored = vault.encrypt('AIzaSyExampleExampleExampleExample123')
  assert.ok(!stored.includes('AIza'))
  assert.equal(vault.decrypt(stored), 'AIzaSyExampleExampleExampleExample123')
  assert.notEqual(vault.encrypt('same'), vault.encrypt('same')) // new random iv each time
})

test('the vault refuses a wrong secret and a changed value', () => {
  const stored = createVault('one').encrypt('my-key-my-key-my-key-1234')
  assert.equal(createVault('two').decrypt(stored), null)
  const tampered = Buffer.from(stored, 'base64')
  tampered[tampered.length - 1] ^= 1
  assert.equal(createVault('one').decrypt(tampered.toString('base64')), null)
  assert.equal(createVault('one').decrypt('garbage'), null)
})

test('admin input is cleaned and checked', () => {
  const key = 'AIzaSyExampleExampleExampleExample123'
  assert.deepEqual(normalizeAiInput({ enabled: 1, apiKey: `  ${key}  `, model: ' gemini-2.5-flash ' }),
    { enabled: true, apiKey: key, model: 'gemini-2.5-flash' })
  assert.deepEqual(normalizeAiInput({ apiKey: '   ' }), {}) // empty key = keep the saved one
  assert.deepEqual(normalizeAiInput({ model: '' }), { model: 'gemini-2.5-flash' })
  assert.deepEqual(normalizeAiInput({ clearKey: true }), { clearKey: true })
  assert.throws(() => normalizeAiInput({ apiKey: 'short' }), /does not look like/)
  assert.throws(() => normalizeAiInput({ apiKey: 'a b '.repeat(10) }), /does not look like/)
  assert.throws(() => normalizeAiInput({ model: 'bad model/../x' }), /not valid/)
})
