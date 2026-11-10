import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

// Checks the login token and puts the user in req.user
export function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  try {
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' })
  }
}

// Allows only some roles on a route
export const only = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'You are not allowed to do this' })
