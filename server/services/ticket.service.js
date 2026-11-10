import { db } from '../config/db.js'
import { PRIORITIES } from '../config/constants.js'
import HttpError from '../utils/HttpError.js'
import { notify } from './notification.service.js'
import { assigner } from './assigner.js'

// Ticket list query with the names filled in
const TICKET_SELECT = `
  SELECT t.*,
         c.name AS category_name,
         u.name AS created_by_name,
         a.name AS assigned_to_name
  FROM ticket t
  LEFT JOIN category c ON c.id = t.category_id
  LEFT JOIN users u ON u.id = t.created_by
  LEFT JOIN users a ON a.id = t.assigned_to
`

// Small helper: one ticket's title + owner, used to build notifications
async function getTicketInfo(ticketId, columns) {
  const [[t]] = await db.query(`SELECT ${columns} FROM ticket WHERE id = ?`, [ticketId])
  return t
}

/* ---------- STAFF ---------- */

export async function createTicket(userId, { title, description, category_id, priority }, file) {
  if (!title?.trim() || !description?.trim()) {
    throw new HttpError(400, 'Title and description are required')
  }
  const cleanTitle = title.trim()

  const [r] = await db.query(
    `INSERT INTO ticket (title, description, category_id, priority, created_by, attachment, attachment_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      cleanTitle,
      description.trim(),
      category_id || null,
      PRIORITIES.includes(priority) ? priority : 'medium',
      userId,
      file ? file.filename : null,
      file ? file.originalname : null,
    ]
  )
  const id = r.insertId

  await notify(userId, id, `Your ticket "${cleanTitle}" was created`)

  // Automatic assignment: free tech with the lowest workload, or the queue
  await assigner.dispatch()

  return { id }
}

export async function listMyTickets(userId) {
  const [rows] = await db.query(
    `${TICKET_SELECT} WHERE t.created_by = ? ORDER BY t.created_at DESC`,
    [userId]
  )
  return rows
}

// Close one of my resolved tickets
export async function closeTicket(ticketId, userId) {
  const [r] = await db.query(
    `UPDATE ticket SET status = 'closed', closed_at = NOW()
     WHERE id = ? AND created_by = ? AND status = 'resolved'`,
    [ticketId, userId]
  )
  if (r.affectedRows === 0) {
    throw new HttpError(400, 'Only your resolved tickets can be closed')
  }
  const t = await getTicketInfo(ticketId, 'title, assigned_to')
  if (t.assigned_to) {
    await notify(t.assigned_to, ticketId, `Ticket "${t.title}" was closed by the user`)
  }
}

/* ---------- IT USER ---------- */

// Tickets nobody has taken yet
export async function listUnassigned() {
  const [rows] = await db.query(
    `${TICKET_SELECT} WHERE t.assigned_to IS NULL AND t.status = 'open'
     ORDER BY t.created_at DESC`
  )
  return rows
}

// Tickets assigned to one tech
export async function listAssigned(techId) {
  const [rows] = await db.query(
    `${TICKET_SELECT} WHERE t.assigned_to = ? ORDER BY t.created_at DESC`,
    [techId]
  )
  return rows
}

// Take charge of a ticket (a queued ticket cannot be started yet)
export async function takeCharge(ticketId, techId) {
  const [r] = await db.query(
    `UPDATE ticket SET assigned_to = ?, status = 'in_progress'
     WHERE id = ? AND status = 'open' AND queued = 0
       AND (assigned_to IS NULL OR assigned_to = ?)`,
    [techId, ticketId, techId]
  )
  if (r.affectedRows === 0) {
    const [[q]] = await db.query(
      'SELECT queued FROM ticket WHERE id = ? AND assigned_to = ?',
      [ticketId, techId]
    )
    throw new HttpError(
      409,
      q?.queued
        ? 'This ticket is in the queue. It will start as soon as a technician is free'
        : 'This ticket was already taken'
    )
  }
  const t = await getTicketInfo(ticketId, 'title, created_by')
  await notify(t.created_by, ticketId, `Your ticket "${t.title}" is now being handled`)
}

// Update the status of my ticket
export async function updateStatus(ticketId, techId, status) {
  if (!['open', 'in_progress'].includes(status)) {
    throw new HttpError(400, 'Invalid status')
  }
  const [r] = await db.query(
    `UPDATE ticket SET status = ?
     WHERE id = ? AND assigned_to = ? AND status IN ('open', 'in_progress')`,
    [status, ticketId, techId]
  )
  if (r.affectedRows === 0) {
    throw new HttpError(400, 'You can only update your own active tickets')
  }
  const t = await getTicketInfo(ticketId, 'title, created_by')
  await notify(
    t.created_by,
    ticketId,
    `Your ticket "${t.title}" is now ${status.replace('_', ' ')}`
  )
}

// Resolve my ticket
export async function resolveTicket(ticketId, techId, resolutionText) {
  const resolution = (resolutionText || '').trim()
  if (!resolution) {
    throw new HttpError(400, 'Please describe how it was solved')
  }
  const [r] = await db.query(
    `UPDATE ticket SET status = 'resolved', resolution = ?
     WHERE id = ? AND assigned_to = ? AND status IN ('open', 'in_progress')`,
    [resolution, ticketId, techId]
  )
  if (r.affectedRows === 0) {
    throw new HttpError(400, 'You can only resolve your own active tickets')
  }
  const t = await getTicketInfo(ticketId, 'title, created_by')
  await notify(t.created_by, ticketId, `Your ticket "${t.title}" has been resolved`)

  // This tech is free now: give him (or another free tech) the next waiting ticket
  await assigner.dispatch()
}

/* ---------- ADMIN ---------- */

export async function listAllTickets() {
  const [rows] = await db.query(`${TICKET_SELECT} ORDER BY t.created_at DESC`)
  return rows
}
