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

// Adds ticket.priority_source ('ai' or 'user') and ticket.priority_reason if missing.
// Manual equivalent:
//   ALTER TABLE ticket ADD COLUMN priority_source VARCHAR(10) NULL, ADD COLUMN priority_reason VARCHAR(255) NULL;
export async function ensureTicketPrioritySchema() {
  const [cols] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket'
       AND COLUMN_NAME IN ('priority_source', 'priority_reason')`
  )
  const have = new Set(cols.map((c) => c.COLUMN_NAME))
  if (!have.has('priority_source')) {
    await db.query('ALTER TABLE ticket ADD COLUMN priority_source VARCHAR(10) NULL')
  }
  if (!have.has('priority_reason')) {
    await db.query('ALTER TABLE ticket ADD COLUMN priority_reason VARCHAR(255) NULL')
  }
}

// Table for the settings an admin changes from the web page (AI key, model, on/off)
export async function ensureSettingsSchema() {
  await db.query(
    `CREATE TABLE IF NOT EXISTS app_settings (
       setting_key VARCHAR(60) NOT NULL PRIMARY KEY,
       setting_value TEXT NULL,
       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     )`
  )
}
