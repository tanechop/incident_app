import nodemailer from 'nodemailer'
import { db } from '../config/db.js'
import { config } from '../config/env.js'

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

// Creates the bell notification AND sends the email. Never throws.
export async function notify(userId, ticketId, message) {
  try {
    await db.query(
      'INSERT INTO notification (user_id, ticket_id, message) VALUES (?, ?, ?)',
      [userId, ticketId, message]
    )
    if (mailer) {
      const [rows] = await db.query('SELECT email FROM users WHERE id = ?', [userId])
      if (rows[0]) {
        mailer
          .sendMail({
            from: `"GLOBAL SERVICE" <${config.mail.user}>`,
            to: rows[0].email,
            subject: 'Ticket update',
            text: message,
          })
          .catch((err) => console.error('Email failed:', err.message))
      }
    }
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
