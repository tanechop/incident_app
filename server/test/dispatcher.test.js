import test from 'node:test'
import assert from 'node:assert/strict'
import { createAssigner } from '../services/ticketAssignment.service.js'

// A fake MySQL pool that answers the dispatcher's queries with prepared rows
function fakeDb({ techRows, pending, failOnUpdate = false }) {
  const log = []
  const conn = {
    beginTransaction: async () => log.push('BEGIN'),
    commit: async () => log.push('COMMIT'),
    rollback: async () => log.push('ROLLBACK'),
    release: () => log.push('RELEASE'),
    query: async (sql, params) => {
      if (sql.includes('FOR UPDATE')) { log.push('LOCK'); return [[]] }
      if (sql.includes('FROM users u')) return [techRows]
      if (sql.includes('FROM ticket') && sql.includes('queued = 1')) return [pending]
      if (sql.startsWith('UPDATE ticket')) {
        if (failOnUpdate) throw new Error('boom')
        log.push(`UPDATE ticket ${params[2]} -> tech ${params[0]} queued=${params[1]}`)
        return [{ affectedRows: 1 }]
      }
      throw new Error('unexpected query: ' + sql)
    },
  }
  return { log, getConnection: async () => conn }
}

const silent = { error: () => {} }
const rows = (...r) => r.map(([id, name, active, total]) => ({
  id, name, active, total, last_assigned_at: null,
}))

test('free tech gets the ticket inside a locked transaction, then notifications are sent', async () => {
  const db = fakeDb({
    techRows: rows([1, 'Ann', 1, 4], [2, 'Bob', 0, 2]),
    pending: [{ id: 7, title: 'VPN down', priority: 'high', created_at: '2026-01-01', created_by: 99, assigned_to: null }],
  })
  const sent = []
  const a = createAssigner({ db, notify: async (...args) => sent.push(args), log: silent })
  await a.dispatch()

  assert.deepEqual(db.log, ['BEGIN', 'LOCK', 'UPDATE ticket 7 -> tech 2 queued=0', 'COMMIT', 'RELEASE'])
  assert.deepEqual(sent.map((s) => s[0]), [2, 99]) // the tech, then the creator
  assert.match(sent[0][2], /assigned to you/)
})

test('everybody busy: ticket is queued on the first tech and both sides are told', async () => {
  const db = fakeDb({
    techRows: rows([1, 'Ann', 1, 4], [2, 'Bob', 2, 2]),
    pending: [{ id: 8, title: 'Printer', priority: 'low', created_at: '2026-01-01', created_by: 50, assigned_to: null }],
  })
  const sent = []
  const a = createAssigner({ db, notify: async (...args) => sent.push(args), log: silent })
  await a.dispatch()

  assert.ok(db.log.includes('UPDATE ticket 8 -> tech 1 queued=1'))
  assert.match(sent[0][2], /in your queue/)
  assert.match(sent[1][2], /All technicians are busy/)
})

test('moving a queued ticket also tells the tech who held it', async () => {
  const db = fakeDb({
    techRows: rows([1, 'Ann', 1, 4], [2, 'Bob', 0, 2]),
    pending: [{ id: 9, title: 'Wifi', priority: 'medium', created_at: '2026-01-01', created_by: 50, assigned_to: 1 }],
  })
  const sent = []
  const a = createAssigner({ db, notify: async (...args) => sent.push(args), log: silent })
  await a.dispatch()

  assert.deepEqual(sent.map((s) => s[0]), [2, 50, 1])
  assert.match(sent[2][2], /moved to Bob/)
})

test('a database error rolls back, sends nothing and never throws to the caller', async () => {
  const db = fakeDb({
    techRows: rows([1, 'Ann', 0, 0]),
    pending: [{ id: 1, title: 'x', priority: 'medium', created_at: '2026-01-01', created_by: 5, assigned_to: null }],
    failOnUpdate: true,
  })
  const sent = []
  const a = createAssigner({ db, notify: async (...args) => sent.push(args), log: silent })
  await assert.doesNotReject(a.dispatch())

  assert.ok(db.log.includes('ROLLBACK'))
  assert.ok(!db.log.includes('COMMIT'))
  assert.ok(db.log.includes('RELEASE'))
  assert.equal(sent.length, 0)
})

test('triggers that arrive during a run never overlap: one extra run follows', async () => {
  let concurrent = 0
  let maxConcurrent = 0
  let runs = 0
  const db = fakeDb({ techRows: [], pending: [] })
  const original = db.getConnection
  db.getConnection = async () => {
    runs++
    concurrent++
    maxConcurrent = Math.max(maxConcurrent, concurrent)
    await new Promise((r) => setTimeout(r, 20))
    const c = await original()
    const release = c.release
    c.release = () => { concurrent--; release() }
    return c
  }
  const a = createAssigner({ db, notify: async () => {}, log: silent })
  await Promise.all([a.dispatch(), a.dispatch(), a.dispatch(), a.dispatch()])

  assert.equal(maxConcurrent, 1)
  assert.equal(runs, 2) // the first run + a single follow-up for all the late triggers
})
