import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import { db } from '../config/db.js'
import { config } from '../config/env.js'
import { UPLOAD_DIR } from '../middleware/upload.js'
import { buildTicketEmail } from './emailTemplate.js'

// Email is optional: it only works if MAIL_USER and MAIL_PASS are in .env
const mailer =
  config.mail.user && config.mail.pass
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.mail.user, pass: config.mail.pass },
      })
    : null

// Called once at startup: tells if email is working
export function verifyMailer() {
  if (!mailer) {
    console.log('Email is disabled. Check MAIL_USER and MAIL_PASS.')
    return Promise.resolve()
  }
  return mailer
    .verify()
    .then(() => console.log('Gmail connection successful!'))
    .catch((err) => console.error('Gmail connection failed:', err.message))
}

// The full ticket, with the names filled in, for the email
async function loadTicketForEmail(ticketId) {
  const [[ticket]] = await db.query(
    `SELECT t.*,
            c.name AS category_name,
            u.name AS created_by_name,
            u.email AS created_by_email,
            a.name AS assigned_to_name
     FROM ticket t
     LEFT JOIN category c ON c.id = t.category_id
     LEFT JOIN users u ON u.id = t.created_by
     LEFT JOIN users a ON a.id = t.assigned_to
     WHERE t.id = ?`,
    [ticketId]
  )
  return ticket
}

// Sends the email with every detail of the ticket. Never throws.
async function sendEmail(userId, ticketId, message) {
  try {
    const [[user]] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId])
    if (!user) return

    const ticket = ticketId ? await loadTicketForEmail(ticketId) : null
    let mail
    if (ticket) {
      mail = buildTicketEmail({
        recipientName: user.name,
        message,
        ticket,
        appUrl: config.appUrl,
      })
      // Send the file the user attached to the ticket
      const file = ticket.attachment ? path.join(UPLOAD_DIR, path.basename(ticket.attachment)) : null
      if (file && fs.existsSync(file)) {
        mail.attachments = [{ filename: ticket.attachment_name || ticket.attachment, path: file }]
      }
    } else {
      mail = { subject: 'Ticket update', text: message }
    }

    await mailer.sendMail({
      from: `"GLOBAL SERVICE" <${config.mail.user}>`,
      to: user.email,
      ...mail,
    })
  } catch (err) {
    console.error('Email failed:', err.message)
  }
}

// Creates the bell notification AND sends the email. Never throws.
export async function notify(userId, ticketId, message) {
  try {
    await db.query(
      'INSERT INTO notification (user_id, ticket_id, message) VALUES (?, ?, ?)',
      [userId, ticketId, message]
    )
    if (mailer) sendEmail(userId, ticketId, message) // not awaited: the request must not wait for Gmail
  } catch (err) {
    console.error('Notification failed:', err.message)
  }
}

export async function listForUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30',
    [userId]
  )
  return rows
}

export async function markAllRead(userId) {
  await db.query('UPDATE notification SET is_read = 1 WHERE user_id = ?', [userId])
}

export async function markRead(notificationId, userId) {
  await db.query(
    'UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  )
}
