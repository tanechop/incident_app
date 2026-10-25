import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in the .env file')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json())

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'incident_db',
})
db.query('SELECT 1')
  .then(() => console.log('MySQL database connected successfully!'))
  .catch((err) => console.error('Database connection failed:', err.message))

const ROLES = ['staff', 'it_user', 'admin']
const PRIORITIES = ['low', 'medium', 'high']

/* HELPERS */

// Catches errors inside async routes so the server never crashes
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  })

// Checks the login token and puts the user in req.user
function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' })
  }
}

// Allows only some roles on a route
const only = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'You are not allowed to do this' })

// Email is optional: it only works if MAIL_USER and MAIL_PASS are in .env
const mailer =
  process.env.MAIL_USER && process.env.MAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      })
    : null
    if (mailer) {
  mailer.verify()
    .then(() => console.log('Gmail connection successful!'))
    .catch((err) => {
      console.error('Gmail connection failed:', err.message)
    })
} else {
  console.log('Email is disabled. Check MAIL_USER and MAIL_PASS.')
}

// Creates the bell notification AND sends the email
async function notify(userId, ticketId, message) {
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
            from: `"GLOBAL SERVICE" <${process.env.MAIL_USER}>`,
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
/* TEST + LOGIN */

app.get('/', (req, res) => res.send('API is running'))

app.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  res.json({ token, role: user.role, name: user.name })
}))

/* CATEGORIES   */

app.get('/categories', auth, wrap(async (req, res) => {
  const [rows] = await db.query('SELECT id, name FROM category ORDER BY name')
  res.json(rows)
}))

app.post('/categories', auth, only('admin'), wrap(async (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const [r] = await db.query('INSERT INTO category (name) VALUES (?)', [name])
  res.status(201).json({ id: r.insertId, name })
}))

app.put('/categories/:id', auth, only('admin'), wrap(async (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Name is required' })
  await db.query('UPDATE category SET name = ? WHERE id = ?', [name, req.params.id])
  res.json({ ok: true })
}))

app.delete('/categories/:id', auth, only('admin'), wrap(async (req, res) => {
  try {
    await db.query('DELETE FROM category WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'This category is used by tickets and cannot be deleted' })
    }
    throw err
  }
}))

/*   TICKETS - STAFF */

// Create a ticket
app.post('/tickets', auth, only('staff'), wrap(async (req, res) => {
  const { title, description, category_id, priority } = req.body
  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required' })
  }

  const [r] = await db.query(
    `INSERT INTO ticket (title, description, category_id, priority, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      title.trim(),
      description.trim(),
      category_id || null,
      PRIORITIES.includes(priority) ? priority : 'medium',
      req.user.id,
    ]
  )
  const id = r.insertId

  await notify(req.user.id, id, `Your ticket "${title.trim()}" was created`)
  const [techs] = await db.query("SELECT id FROM users WHERE role = 'it_user'")
  for (const t of techs) {
    await notify(t.id, id, `New ticket available: "${title.trim()}"`)
  }

  res.status(201).json({ id })
}))

// My tickets
app.get('/tickets/my', auth, only('staff'), wrap(async (req, res) => {
  const [rows] = await db.query(
    `${TICKET_SELECT} WHERE t.created_by = ? ORDER BY t.created_at DESC`,
    [req.user.id]
  )
  res.json(rows)
}))

// Close one of my resolved tickets
app.put('/tickets/:id/close', auth, only('staff'), wrap(async (req, res) => {
  const [r] = await db.query(
    `UPDATE ticket SET status = 'closed', closed_at = NOW()
     WHERE id = ? AND created_by = ? AND status = 'resolved'`,
    [req.params.id, req.user.id]
  )
  if (r.affectedRows === 0) {
    return res.status(400).json({ error: 'Only your resolved tickets can be closed' })
  }
  const [[t]] = await db.query('SELECT title, assigned_to FROM ticket WHERE id = ?', [req.params.id])
  if (t.assigned_to) {
    await notify(t.assigned_to, req.params.id, `Ticket "${t.title}" was closed by the user`)
  }
  res.json({ ok: true })
}))

/* TICKETS - IT USER */
// Tickets nobody has taken yet
app.get('/tickets/unassigned', auth, only('it_user'), wrap(async (req, res) => {
  const [rows] = await db.query(
    `${TICKET_SELECT} WHERE t.assigned_to IS NULL AND t.status = 'open'
     ORDER BY t.created_at DESC`
  )
  res.json(rows)
}))

// Tickets assigned to me
app.get('/tickets/assigned', auth, only('it_user'), wrap(async (req, res) => {
  const [rows] = await db.query(
    `${TICKET_SELECT} WHERE t.assigned_to = ? ORDER BY t.created_at DESC`,
    [req.user.id]
  )
  res.json(rows)
}))

// Take charge of a ticket
app.put('/tickets/:id/take-charge', auth, only('it_user'), wrap(async (req, res) => {
  const [r] = await db.query(
    `UPDATE ticket SET assigned_to = ?, status = 'in_progress'
     WHERE id = ? AND status = 'open' AND (assigned_to IS NULL OR assigned_to = ?)`,
    [req.user.id, req.params.id, req.user.id]
  )
  if (r.affectedRows === 0) {
    return res.status(409).json({ error: 'This ticket was already taken' })
  }
  const [[t]] = await db.query('SELECT title, created_by FROM ticket WHERE id = ?', [req.params.id])
  await notify(t.created_by, req.params.id, `Your ticket "${t.title}" is now being handled`)
  res.json({ ok: true })
}))

// Update the status of my ticket
app.put('/tickets/:id/status', auth, only('it_user'), wrap(async (req, res) => {
  const { status } = req.body
  if (!['open', 'in_progress'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  const [r] = await db.query(
    `UPDATE ticket SET status = ?
     WHERE id = ? AND assigned_to = ? AND status IN ('open', 'in_progress')`,
    [status, req.params.id, req.user.id]
  )
  if (r.affectedRows === 0) {
    return res.status(400).json({ error: 'You can only update your own active tickets' })
  }
  const [[t]] = await db.query('SELECT title, created_by FROM ticket WHERE id = ?', [req.params.id])
  await notify(
    t.created_by,
    req.params.id,
    `Your ticket "${t.title}" is now ${status.replace('_', ' ')}`
  )
  res.json({ ok: true })
}))

// Resolve my ticket
app.put('/tickets/:id/resolve', auth, only('it_user'), wrap(async (req, res) => {
  const resolution = (req.body.resolution || '').trim()
  if (!resolution) {
    return res.status(400).json({ error: 'Please describe how it was solved' })
  }
  const [r] = await db.query(
    `UPDATE ticket SET status = 'resolved', resolution = ?
     WHERE id = ? AND assigned_to = ? AND status IN ('open', 'in_progress')`,
    [resolution, req.params.id, req.user.id]
  )
  if (r.affectedRows === 0) {
    return res.status(400).json({ error: 'You can only resolve your own active tickets' })
  }
  const [[t]] = await db.query('SELECT title, created_by FROM ticket WHERE id = ?', [req.params.id])
  await notify(t.created_by, req.params.id, `Your ticket "${t.title}" has been resolved`)
  res.json({ ok: true })
}))

/* TICKETS - ADMIN */

app.get('/tickets', auth, only('admin'), wrap(async (req, res) => {
  const [rows] = await db.query(`${TICKET_SELECT} ORDER BY t.created_at DESC`)
  res.json(rows)
}))

app.put('/tickets/:id/assign', auth, only('admin'), wrap(async (req, res) => {
  const [techs] = await db.query(
    "SELECT id FROM users WHERE id = ? AND role = 'it_user'",
    [req.body.assigned_to]
  )
  if (!techs[0]) return res.status(400).json({ error: 'Choose a valid IT user' })

  const [r] = await db.query(
    "UPDATE ticket SET assigned_to = ? WHERE id = ? AND status <> 'closed'",
    [techs[0].id, req.params.id]
  )
  if (r.affectedRows === 0) {
    return res.status(400).json({ error: 'Ticket not found or already closed' })
  }
  const [[t]] = await db.query('SELECT title FROM ticket WHERE id = ?', [req.params.id])
  await notify(techs[0].id, req.params.id, `Ticket "${t.title}" was assigned to you`)
  res.json({ ok: true })
}))

/*  USERS - ADMIN*/

app.get('/users', auth, only('admin'), wrap(async (req, res) => {
  const { role } = req.query
  const [rows] = ROLES.includes(role)
    ? await db.query(
        'SELECT id, name, email, role, created_at FROM users WHERE role = ? ORDER BY id',
        [role]
      )
    : await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY id')
  res.json(rows)
}))

app.post('/users', auth, only('admin'), wrap(async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const [r] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), hash, role]
    )
    res.status(201).json({ id: r.insertId })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This email is already used' })
    }
    throw err
  }
}))

app.delete('/users/:id', auth, only('admin'), wrap(async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' })
  }
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'This user has tickets and cannot be deleted' })
    }
    throw err
  }
}))

/*  STATISTICS - ADMIN */

app.get('/stats', auth, only('admin'), wrap(async (req, res) => {
  const [[u]] = await db.query('SELECT COUNT(*) AS n FROM users')
  const [[s]] = await db.query(`
    SELECT COUNT(*) AS tickets,
           COALESCE(SUM(status = 'open'), 0) AS \`open\`,
           COALESCE(SUM(status = 'in_progress'), 0) AS in_progress,
           COALESCE(SUM(status = 'resolved'), 0) AS resolved,
           COALESCE(SUM(status = 'closed'), 0) AS closed
    FROM ticket
  `)
  const [byCategory] = await db.query(`
    SELECT c.name, COUNT(t.id) AS total
    FROM category c
    LEFT JOIN ticket t ON t.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY total DESC
  `)
  const [byPriority] = await db.query(
    'SELECT priority, COUNT(*) AS total FROM ticket GROUP BY priority'
  )

  res.json({
    users: Number(u.n),
    tickets: Number(s.tickets),
    open: Number(s.open),
    in_progress: Number(s.in_progress),
    resolved: Number(s.resolved),
    closed: Number(s.closed),
    byCategory: byCategory.map((c) => ({ name: c.name, total: Number(c.total) })),
    byPriority: byPriority.map((p) => ({ priority: p.priority, total: Number(p.total) })),
  })
}))
/*   NOTIFICATIONS (the bell)*/
app.get('/notifications', auth, wrap(async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30',
    [req.user.id]
  )
  res.json(rows)
}))

app.put('/notifications/read-all', auth, wrap(async (req, res) => {
  await db.query('UPDATE notification SET is_read = 1 WHERE user_id = ?', [req.user.id])
  res.json({ ok: true })
}))

app.put('/notifications/:id/read', auth, wrap(async (req, res) => {
  await db.query(
    'UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  res.json({ ok: true })
}))
app.get('/', (req, res) => {
  res.send('API is running')
})
app.listen(3000, () => console.log('Server is running on port 3000'))
