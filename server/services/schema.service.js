import { db } from '../config/db.js'

// Adds users.category_id if it is missing (safe to run on every start).
// Manual equivalent:
//   ALTER TABLE users ADD COLUMN category_id INT NULL AFTER role, ADD INDEX idx_users_category (category_id);
export async function ensureUserSchema() {
  const [cols] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'category_id'`
  )
  if (cols.length === 0) {
    await db.query('ALTER TABLE users ADD COLUMN category_id INT NULL AFTER role')
    await db.query('ALTER TABLE users ADD INDEX idx_users_category (category_id)')
  }
}
