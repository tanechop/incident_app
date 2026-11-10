import test from 'node:test'
import assert from 'node:assert/strict'
import HttpError from '../utils/HttpError.js'
import asyncHandler from '../middleware/asyncHandler.js'
import errorHandler from '../middleware/errorHandler.js'

const fakeRes = () => ({
  code: null,
  body: null,
  status(c) { this.code = c; return this },
  json(b) { this.body = b; return this },
})

// Runs a handler the way express does and returns what the client would get
async function run(handler) {
  const res = fakeRes()
  let error
  await asyncHandler(handler)({}, res, (err) => { error = err })
  await new Promise((r) => setImmediate(r))
  if (error) errorHandler(error, {}, res, () => {})
  return res
}

test('an HttpError becomes its status code and message', async () => {
  const res = await run(async () => { throw new HttpError(409, 'This ticket was already taken') })
  assert.equal(res.code, 409)
  assert.deepEqual(res.body, { error: 'This ticket was already taken' })
})

test('an unexpected error becomes a generic 500 and leaks nothing', async () => {
  const original = console.error
  console.error = () => {}
  try {
    const res = await run(async () => { throw new Error('SELECT secret FROM ...') })
    assert.equal(res.code, 500)
    assert.deepEqual(res.body, { error: 'Server error' })
  } finally {
    console.error = original
  }
})

test('a successful handler answers normally and sends no error', async () => {
  const res = await run(async (req, r) => r.status(201).json({ id: 1 }))
  assert.equal(res.code, 201)
  assert.deepEqual(res.body, { id: 1 })
})

test('a synchronous throw inside the handler is caught too', async () => {
  const res = await run(() => { throw new HttpError(400, 'Invalid status') })
  assert.equal(res.code, 400)
})
