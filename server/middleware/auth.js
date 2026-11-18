import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { db } from '../config/db.js'

// Checks the login token and puts the user in req.user.
// The role is read from the database on every request, so an admin who edits
// or deletes an account takes effect immediately (not after the token expires).
export async function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' })
  }

  try {
    const [[user]] = await db.query('SELECT id, role FROM users WHERE id = ?', [payload.id])
    if (!user) return res.status(401).json({ error: 'Session expired, please log in again' })
    req.user = { ...payload, id: user.id, role: user.role }
    next()
  } catch (err) {
    next(err)
  }
}

// Allows only some roles on a route
export const only = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'You are not allowed to do this' })
