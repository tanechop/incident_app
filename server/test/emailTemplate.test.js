import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTicketEmail, escapeHtml } from '../services/emailTemplate.js'

const ticket = {
  id: 12,
  title: 'Printer  down',
  description: 'The printer on floor 2\nshows error 49.',
  priority: 'high',
  status: 'in_progress',
  category_name: 'Hardware',
  created_by_name: 'Alice',
  created_by_email: 'alice@corp.com',
  assigned_to_name: 'Bob',
  queued: 0,
  created_at: '2026-11-10T09:30:00Z',
  assigned_at: '2026-11-10T09:31:00Z',
  closed_at: null,
  resolution: null,
  attachment_name: 'error.png',
}

const mail = buildTicketEmail({
  recipientName: 'Alice',
  message: 'Your ticket "Printer down" is now being handled',
  ticket,
  appUrl: 'http://localhost:5173',
})

test('subject starts with the ticket number', () => {
  assert.equal(mail.subject, '[Ticket #12] Your ticket "Printer down" is now being handled')
})

test('text version holds every field of the ticket', () => {
  for (const part of [
    '#12', 'Printer down', 'High', 'In progress', 'Hardware',
    'Alice (alice@corp.com)', 'Bob', 'error.png',
    'The printer on floor 2\nshows error 49.', 'http://localhost:5173',
  ]) {
    assert.ok(mail.text.includes(part), `text is missing: ${part}`)
  }
})

test('html version holds the same fields and the priority colour', () => {
  for (const part of ['Printer down', 'High', 'In progress', 'Hardware', 'Bob', 'error.png', 'floor 2']) {
    assert.ok(mail.html.includes(part), `html is missing: ${part}`)
  }
  assert.ok(mail.html.includes('#dc3545'))
})

test('empty fields are left out and a resolution is shown when there is one', () => {
  const solved = buildTicketEmail({
    recipientName: 'Alice',
    message: 'Your ticket was resolved',
    ticket: { ...ticket, status: 'resolved', attachment_name: null, resolution: 'Replaced the toner' },
  })
  assert.ok(!solved.text.includes('Attachment'))
  assert.ok(solved.text.includes('RESOLUTION') && solved.text.includes('Replaced the toner'))
  assert.ok(solved.html.includes('Replaced the toner'))
  assert.ok(!mail.text.includes('RESOLUTION'))
})

test('a queued or unassigned ticket says so', () => {
  const queued = buildTicketEmail({ message: 'm', ticket: { ...ticket, queued: 1 } })
  assert.ok(queued.text.includes('Bob (waiting in the queue)'))
  const none = buildTicketEmail({ message: 'm', ticket: { ...ticket, assigned_to_name: null } })
  assert.ok(none.text.includes('Not assigned yet'))
})

test('user text cannot inject HTML', () => {
  const evil = buildTicketEmail({
    message: 'm',
    ticket: { ...ticket, title: '<script>x()</script>', description: '<img src=x onerror=1>' },
  })
  assert.ok(!evil.html.includes('<script>'))
  assert.ok(!evil.html.includes('<img'))
  assert.equal(escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
})

test('a title with line breaks cannot break the subject header', () => {
  const m = buildTicketEmail({ message: 'a\r\nBcc: x@y.com', ticket })
  assert.ok(!/[\r\n]/.test(m.subject))
})
