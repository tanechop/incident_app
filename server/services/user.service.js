import bcrypt from 'bcryptjs'
import { db } from '../config/db.js'
import { ROLES } from '../config/constants.js'
import HttpError from '../utils/HttpError.js'
import { assigner } from './assigner.js'

const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.category_id,
         c.name AS category_name, u.created_at
  FROM users u
  LEFT JOIN category c ON c.id = u.category_id
`

export async function listUsers(role) {
  const [rows] = ROLES.includes(role)
    ? await db.query(`${USER_SELECT} WHERE u.role = ? ORDER BY u.id`, [role])
    : await db.query(`${USER_SELECT} ORDER BY u.id`)
  return rows
}

export async function createUser({ name, email, password, role, category_id }) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw new HttpError(400, 'Name, email and password are required')
  }
  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters')
  }
  if (!ROLES.includes(role)) {
    throw new HttpError(400, 'Invalid role')
  }

  // The category is optional, but when given it must exist
  let categoryId = null
  if (category_id !== undefined && category_id !== null && category_id !== '') {
    const [[cat]] = await db.query('SELECT id FROM category WHERE id = ?', [category_id])
    if (!cat) throw new HttpError(400, 'Invalid user category')
    categoryId = cat.id
  }

  let id
  try {
    const hash = await bcrypt.hash(password, 10)
    const [r] = await db.query(
      'INSERT INTO users (name, email, password, role, category_id) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), hash, role, categoryId]
    )
    id = r.insertId
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(400, 'This email is already used')
    throw err
  }

  // A new tech is free: he can take waiting tickets right away
  if (role === 'it_user') await assigner.dispatch()
  return { id }
}

export async function deleteUser(id, currentUserId) {
  if (Number(id) === currentUserId) {
    throw new HttpError(400, 'You cannot delete your own account')
  }
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id])
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(400, 'This user has tickets and cannot be deleted')
    }
    throw err
  }
  // The "first tech" may have changed
  await assigner.dispatch()
}
