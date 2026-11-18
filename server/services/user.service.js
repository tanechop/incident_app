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

// The category is optional, but when given it must exist
async function resolveCategory(category_id) {
  if (category_id === undefined || category_id === null || category_id === '') return null
  const [[cat]] = await db.query('SELECT id FROM category WHERE id = ?', [category_id])
  if (!cat) throw new HttpError(400, 'Invalid user category')
  return cat.id
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

  const categoryId = await resolveCategory(category_id)

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

// Admin edits an account. The password is optional: empty means "keep the current one".
export async function updateUser(id, { name, email, password, role, category_id }, currentUserId) {
  const [[existing]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id])
  if (!existing) throw new HttpError(404, 'User not found')

  if (!name?.trim() || !email?.trim()) {
    throw new HttpError(400, 'Name and email are required')
  }
  if (!ROLES.includes(role)) {
    throw new HttpError(400, 'Invalid role')
  }
  if (password && password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters')
  }

  const roleChanged = role !== existing.role
  if (roleChanged) {
    // Otherwise the platform could be left without any admin
    if (Number(id) === currentUserId) {
      throw new HttpError(400, 'You cannot change your own role')
    }
    // A tech who still holds tickets cannot stop being a tech
    if (existing.role === 'it_user') {
      const [[busy]] = await db.query(
        `SELECT COUNT(*) AS n FROM ticket
         WHERE assigned_to = ? AND status IN ('open', 'in_progress')`,
        [id]
      )
      if (busy.n > 0) {
        throw new HttpError(
          400,
          `This IT user still has ${busy.n} open ticket(s). Let them finish or close them first.`
        )
      }
    }
  }

  const categoryId = await resolveCategory(category_id)

  const fields = ['name = ?', 'email = ?', 'role = ?', 'category_id = ?']
  const values = [name.trim(), email.trim(), role, categoryId]
  if (password) {
    fields.push('password = ?')
    values.push(await bcrypt.hash(password, 10))
  }

  try {
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, id])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(400, 'This email is already used')
    throw err
  }

  // The pool of free techs changed
  if (roleChanged) await assigner.dispatch()
  return { id: Number(id) }
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
