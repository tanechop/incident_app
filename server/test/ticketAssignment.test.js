import test from 'node:test'
import assert from 'node:assert/strict'
import { planAssignments } from '../services/ticketAssignment.service.js'

const tech = (id, active = 0, total = 0, lastAssignedAt = null) => ({
  id, name: `Tech${id}`, active, total, lastAssignedAt,
})
const ticket = (id, extra = {}) => ({
  id, priority: 'medium', created_at: `2026-01-01T10:00:${String(id).padStart(2, '0')}Z`,
  assigned_to: null, ...extra,
})

test('a single free tech gets the ticket', () => {
  const plan = planAssignments([tech(1)], [ticket(10)])
  assert.deepEqual(plan.map((p) => [p.ticketId, p.techId, p.queued]), [[10, 1, false]])
})

test('the busy tech is skipped when another one is free', () => {
  const plan = planAssignments([tech(1, 1, 5), tech(2, 0, 9)], [ticket(10)])
  assert.equal(plan[0].techId, 2)
  assert.equal(plan[0].queued, false)
})

test('free techs share the work evenly (fewest handled first)', () => {
  const plan = planAssignments([tech(1, 0, 4), tech(2, 0, 2), tech(3, 0, 3)], [ticket(10)])
  assert.equal(plan[0].techId, 2)
})

test('equal workload: the one who waited longest goes first, then lowest id', () => {
  let plan = planAssignments([tech(1, 0, 2, 2000), tech(2, 0, 2, 1000)], [ticket(10)])
  assert.equal(plan[0].techId, 2)
  plan = planAssignments([tech(1), tech(2), tech(3)], [ticket(10)])
  assert.equal(plan[0].techId, 1)
})

test('several tickets at once are spread round-robin over free techs', () => {
  const plan = planAssignments([tech(1), tech(2), tech(3)], [ticket(1), ticket(2), ticket(3)])
  assert.deepEqual(plan.map((p) => p.techId).sort(), [1, 2, 3])
  assert.ok(plan.every((p) => !p.queued))
})

test('everybody busy: the ticket is queued on the FIRST tech', () => {
  const plan = planAssignments([tech(3, 1, 1), tech(1, 1, 7), tech(2, 2, 2)], [ticket(10)])
  assert.deepEqual(plan.map((p) => [p.techId, p.queued]), [[1, true]])
})

test('a queued ticket moves to another tech who finishes before the first one', () => {
  const queued = ticket(10, { assigned_to: 1 })
  const plan = planAssignments([tech(1, 1, 3), tech(2, 0, 3)], [queued])
  assert.equal(plan.length, 1)
  assert.equal(plan[0].techId, 2)
  assert.equal(plan[0].queued, false)
  assert.equal(plan[0].previousTechId, 1)
})

test('a queued ticket goes to the first tech when he is the one who finishes', () => {
  const plan = planAssignments([tech(1, 0, 3), tech(2, 1, 3)], [ticket(10, { assigned_to: 1 })])
  assert.equal(plan[0].techId, 1)
  assert.equal(plan[0].queued, false)
})

test('a ticket that is already queued stays untouched while nobody is free', () => {
  const plan = planAssignments([tech(1, 1), tech(2, 1)], [ticket(10, { assigned_to: 1 })])
  assert.deepEqual(plan, [])
})

test('after one tech becomes free only ONE queued ticket moves to him', () => {
  const pending = [ticket(1, { assigned_to: 1 }), ticket(2, { assigned_to: 1 })]
  const plan = planAssignments([tech(1, 1), tech(2, 0)], pending)
  assert.equal(plan.length, 1)
  assert.equal(plan[0].ticketId, 1) // the oldest waits the least
  assert.equal(plan[0].techId, 2)
})

test('high priority is served before older low priority tickets', () => {
  const pending = [ticket(1, { priority: 'low' }), ticket(2, { priority: 'high' })]
  const plan = planAssignments([tech(1)], pending)
  assert.equal(plan[0].ticketId, 2)
  assert.equal(plan[0].queued, false)
  assert.equal(plan[1].ticketId, 1)
  assert.equal(plan[1].queued, true)
})

test('no tech accounts at all: nothing is planned', () => {
  assert.deepEqual(planAssignments([], [ticket(1)]), [])
})

test('the input data is never modified', () => {
  const techs = [tech(1)]
  planAssignments(techs, [ticket(1)])
  assert.equal(techs[0].active, 0)
})
