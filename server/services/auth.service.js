import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../config/db.js'
import { config } from '../config/env.js'
import HttpError from '../utils/HttpError.js'

export async function login(email, password) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required')
  }

  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
  const user = rows[0]
  if (!user) throw new HttpError(401, 'Invalid email or password')

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw new HttpError(401, 'Invalid email or password')

  const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
  return { token, role: user.role, name: user.name }
}
