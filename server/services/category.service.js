import { db } from '../config/db.js'
import HttpError from '../utils/HttpError.js'

const cleanName = (name) => {
  const clean = (name || '').trim()
  if (!clean) throw new HttpError(400, 'Name is required')
  return clean
}

export async function listCategories() {
  const [rows] = await db.query('SELECT id, name FROM category ORDER BY name')
  return rows
}

export async function createCategory(name) {
  const clean = cleanName(name)
  const [r] = await db.query('INSERT INTO category (name) VALUES (?)', [clean])
  return { id: r.insertId, name: clean }
}

export async function renameCategory(id, name) {
  const clean = cleanName(name)
  await db.query('UPDATE category SET name = ? WHERE id = ?', [clean, id])
}

export async function deleteCategory(id) {
  try {
    await db.query('DELETE FROM category WHERE id = ?', [id])
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(400, 'This category is used by tickets and cannot be deleted')
    }
    throw err
  }
  // Users keep working: they just lose this category
  await db.query('UPDATE users SET category_id = NULL WHERE category_id = ?', [id])
}
