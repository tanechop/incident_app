/**
 * Automatic ticket assignment
 * ===========================
 *
 * RULES
 *  1. A tech user is AVAILABLE when he has no work on hand, meaning no ticket
 *     that is 'open' or 'in_progress' and not waiting in the queue.
 *  2. Several techs are available -> the ticket goes to the one who has handled
 *     the fewest tickets so far, so the work is spread evenly. Ties are broken
 *     by "who waited longest since his last assignment", then by lowest id.
 *  3. Nobody is available -> the ticket is QUEUED on the FIRST tech
 *     (lowest id). It is a waiting ticket: it does not make him busy and he
 *     cannot start it yet.
 *  4. Every time a tech finishes (or anything else changes), the queue is
 *     dispatched again. A queued ticket moves to whichever tech is free first,
 *     even if it is not the first tech.
 *
 * Pending tickets are served by priority (high -> low), then oldest first.
 *
 * DATABASE (added automatically at startup by ensureSchema, or run by hand):
 *   ALTER TABLE ticket
 *     ADD COLUMN queued TINYINT(1) NOT NULL DEFAULT 0 AFTER assigned_to,
 *     ADD COLUMN assigned_at DATETIME NULL AFTER queued;
 */

/* ------------------------------------------------------------------ */
/* 1. PURE DECISION LOGIC (no database, easy to unit test)             */
/* ------------------------------------------------------------------ */

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

// Order pending tickets: highest priority first, then oldest, then lowest id
export function sortPending(pending) {
  return [...pending].sort(
    (a, b) =>
      (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1) ||
      new Date(a.created_at) - new Date(b.created_at) ||
      a.id - b.id
  )
}

// "Fairest" tech first: fewest tickets handled, waited longest, lowest id
function byFairness(a, b) {
  return (
    a.total - b.total ||
    (a.lastAssignedAt ?? -Infinity) - (b.lastAssignedAt ?? -Infinity) ||
    a.id - b.id
  )
}

/**
 * Decide what to do with every pending ticket.
 *
 * @param techs   [{ id, name, active, total, lastAssignedAt }]
 *                active = tickets on his hand, total = tickets handled so far,
 *                lastAssignedAt = timestamp in ms or null
 * @param pending [{ id, priority, created_at, assigned_to }]
 *                assigned_to is null for a fresh ticket, or the tech who holds
 *                it in the queue
 * @returns a list of changes: { ticketId, techId, techName, queued, previousTechId }
 *          A ticket that stays where it is has no entry.
 */
export function planAssignments(techs, pending, now = Date.now()) {
  const pool = techs
    .map((t) => ({ ...t }))
    .sort((a, b) => a.id - b.id) // pool[0] is the "first tech"
  const plan = []
  let tick = 0

  for (const ticket of sortPending(pending)) {
    const free = pool.filter((t) => t.active === 0).sort(byFairness)

    if (free.length > 0) {
      // Rules 1 + 2 (and 4 when the ticket was waiting in the queue)
      const tech = free[0]
      tech.active += 1
      tech.total += 1
      tech.lastAssignedAt = now + tick++
      plan.push({
        ticketId: ticket.id,
        techId: tech.id,
        techName: tech.name,
        queued: false,
        previousTechId: ticket.assigned_to ?? null,
      })
    } else if (ticket.assigned_to == null && pool.length > 0) {
      // Rule 3: everybody is busy -> wait in the first tech's queue
      const first = pool[0]
      plan.push({
        ticketId: ticket.id,
        techId: first.id,
        techName: first.name,
        queued: true,
        previousTechId: null,
      })
    }
    // else: already queued and nobody is free yet -> leave it alone
  }
  return plan
}

/* ------------------------------------------------------------------ */
/* 2. DATABASE LAYER                                                   */
/* ------------------------------------------------------------------ */

export function createAssigner({ db, notify, log = console }) {
  // Adds the two columns if they are missing (safe to run on every start)
  async function ensureSchema() {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket'
         AND COLUMN_NAME IN ('queued', 'assigned_at')`
    )
    const have = new Set(cols.map((c) => c.COLUMN_NAME))
    if (!have.has('queued')) {
      await db.query(
        'ALTER TABLE ticket ADD COLUMN queued TINYINT(1) NOT NULL DEFAULT 0 AFTER assigned_to'
      )
    }
    if (!have.has('assigned_at')) {
      await db.query('ALTER TABLE ticket ADD COLUMN assigned_at DATETIME NULL AFTER queued')
      // old tickets: use their creation date as the assignment date
      await db.query(
        'UPDATE ticket SET assigned_at = created_at WHERE assigned_to IS NOT NULL AND assigned_at IS NULL'
      )
    }
  }

  // One run of the dispatcher. Only one run can work at a time because it
  // locks the tech rows, so two tickets can never pick the same "free" tech.
  async function runOnce() {
    const conn = await db.getConnection()
    const applied = []
    try {
      await conn.beginTransaction()
      await conn.query("SELECT id FROM users WHERE role = 'it_user' ORDER BY id FOR UPDATE")

      // Workload of every tech. Queued tickets are NOT counted: they are waiting.
      const [techRows] = await conn.query(
        `SELECT u.id, u.name,
                COALESCE(SUM(t.status IN ('open', 'in_progress')), 0) AS active,
                COUNT(t.id) AS total,
                MAX(t.assigned_at) AS last_assigned_at
         FROM users u
         LEFT JOIN ticket t ON t.assigned_to = u.id AND t.queued = 0
         WHERE u.role = 'it_user'
         GROUP BY u.id, u.name
         ORDER BY u.id`
      )
      const techs = techRows.map((r) => ({
        id: r.id,
        name: r.name,
        active: Number(r.active),
        total: Number(r.total),
        lastAssignedAt: r.last_assigned_at ? new Date(r.last_assigned_at).getTime() : null,
      }))

      // Tickets waiting for a tech: brand new ones and the queued ones
      const [pending] = await conn.query(
        `SELECT id, title, priority, created_at, created_by, assigned_to
         FROM ticket
         WHERE status = 'open' AND (queued = 1 OR assigned_to IS NULL)`
      )

      const plan = planAssignments(techs, pending)
      const byId = new Map(pending.map((t) => [t.id, t]))

      for (const step of plan) {
        // The extra WHERE keeps us from overriding an admin who just assigned it by hand
        const [r] = await conn.query(
          `UPDATE ticket
           SET assigned_to = ?, queued = ?, assigned_at = NOW()
           WHERE id = ? AND status = 'open' AND (queued = 1 OR assigned_to IS NULL)`,
          [step.techId, step.queued ? 1 : 0, step.ticketId]
        )
        if (r.affectedRows > 0) applied.push({ ...step, ticket: byId.get(step.ticketId) })
      }

      await conn.commit()
    } catch (err) {
      await conn.rollback().catch(() => {})
      throw err
    } finally {
      conn.release()
    }

    // Notifications go out only after the changes are saved
    for (const s of applied) {
      const title = s.ticket.title
      if (s.queued) {
        await notify(s.techId, s.ticketId, `Ticket "${title}" is in your queue. It will be moved to the first technician who is free`)
        await notify(s.ticket.created_by, s.ticketId, `All technicians are busy. Your ticket "${title}" is in the queue`)
      } else {
        await notify(s.techId, s.ticketId, `Ticket "${title}" was assigned to you`)
        await notify(s.ticket.created_by, s.ticketId, `Your ticket "${title}" was assigned to ${s.techName}`)
        if (s.previousTechId && s.previousTechId !== s.techId) {
          await notify(s.previousTechId, s.ticketId, `Ticket "${title}" was moved to ${s.techName} who was free first`)
        }
      }
    }
    return applied
  }

  // Runs never overlap inside this process. If a trigger arrives while a run
  // is busy, exactly one more run is done afterwards.
  let running = null
  let again = false
  async function dispatch() {
    if (running) {
      again = true
      return running
    }
    running = (async () => {
      try {
        do {
          again = false
          await runOnce()
        } while (again)
      } finally {
        running = null
      }
    })()
    return running
  }

  // Never throws: a failed dispatch must not break the request that triggered
  // it. The ticket stays pending and is picked up by the next run.
  const safeDispatch = () =>
    dispatch().catch((err) => log.error('Ticket dispatch failed:', err.message))

  // Safety net: catches anything a trigger missed (for example a crash)
  function startSweep(everyMs = 60000) {
    const timer = setInterval(safeDispatch, everyMs)
    timer.unref?.()
    return timer
  }

  return { ensureSchema, dispatch: safeDispatch, startSweep }
}
