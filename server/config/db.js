import mysql from 'mysql2/promise'
import { config } from './env.js'

export const db = mysql.createPool(config.db)

export function checkDatabase() {
  return db
    .query('SELECT 1')
    .then(() => console.log('MySQL database connected successfully!'))
    .catch((err) => console.error('Database connection failed:', err.message))
}
