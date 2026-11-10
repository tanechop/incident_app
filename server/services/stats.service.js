import { db } from '../config/db.js'

const TREND_DAYS = 14

export async function getStats() {
  const [[u]] = await db.query('SELECT COUNT(*) AS n FROM users')
  const [[s]] = await db.query(`
    SELECT COUNT(*) AS tickets,
           COALESCE(SUM(status = 'open'), 0) AS \`open\`,
           COALESCE(SUM(status = 'in_progress'), 0) AS in_progress,
           COALESCE(SUM(status = 'resolved'), 0) AS resolved,
           COALESCE(SUM(status = 'closed'), 0) AS closed,
           COALESCE(SUM(queued = 1), 0) AS queued,
           COALESCE(SUM(assigned_to IS NULL), 0) AS unassigned
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
  const [byRole] = await db.query('SELECT role, COUNT(*) AS total FROM users GROUP BY role')
  const [byUserCategory] = await db.query(`
    SELECT COALESCE(c.name, 'No category') AS name, COUNT(*) AS total
    FROM users u
    LEFT JOIN category c ON c.id = u.category_id
    GROUP BY c.id, c.name
    ORDER BY total DESC
  `)
  const [workload] = await db.query(`
    SELECT u.id, u.name,
           COALESCE(SUM(t.status IN ('open', 'in_progress') AND t.queued = 0), 0) AS active,
           COALESCE(SUM(t.status IN ('resolved', 'closed')), 0) AS done
    FROM users u
    LEFT JOIN ticket t ON t.assigned_to = u.id
    WHERE u.role = 'it_user'
    GROUP BY u.id, u.name
    ORDER BY active DESC, u.name
  `)
  const [trendRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS total
     FROM ticket
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY day`,
    [TREND_DAYS - 1]
  )

  // One entry per day, even for days without tickets
  const perDay = new Map(trendRows.map((r) => [r.day, Number(r.total)]))
  const trend = []
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const day = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
    trend.push({ day, total: perDay.get(day) || 0 })
  }

  return {
    users: Number(u.n),
    tickets: Number(s.tickets),
    open: Number(s.open),
    in_progress: Number(s.in_progress),
    resolved: Number(s.resolved),
    closed: Number(s.closed),
    queued: Number(s.queued),
    unassigned: Number(s.unassigned),
    byCategory: byCategory.map((c) => ({ name: c.name, total: Number(c.total) })),
    byPriority: byPriority.map((p) => ({ priority: p.priority, total: Number(p.total) })),
    byRole: byRole.map((r) => ({ role: r.role, total: Number(r.total) })),
    byUserCategory: byUserCategory.map((c) => ({ name: c.name, total: Number(c.total) })),
    workload: workload.map((w) => ({
      id: w.id, name: w.name, active: Number(w.active), done: Number(w.done),
    })),
    trend,
  }
}
