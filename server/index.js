import { config } from './config/env.js' // loads .env first
import { checkDatabase } from './config/db.js'
import app from './app.js'
import { verifyMailer } from './services/notification.service.js'
import { assigner } from './services/assigner.js'
import { ensureUserSchema, ensureTicketPrioritySchema, ensureSettingsSchema } from './services/schema.service.js'
import { isAiEnabled } from './services/settings.service.js'

checkDatabase()
verifyMailer()

// Add users.category_id if the database does not have it yet
ensureUserSchema().catch((err) =>
  console.error(
    'User category setup failed. Add the column by hand: ' +
      'ALTER TABLE users ADD COLUMN category_id INT NULL AFTER role;',
    err.message
  )
)

// Add the columns that remember who set a ticket's priority
ensureTicketPrioritySchema().catch((err) =>
  console.error(
    'Priority setup failed. Add the columns by hand: ' +
      'ALTER TABLE ticket ADD COLUMN priority_source VARCHAR(10) NULL, ADD COLUMN priority_reason VARCHAR(255) NULL;',
    err.message
  )
)
ensureSettingsSchema()
  .then(isAiEnabled)
  .then((on) => console.log(on ? 'AI priority: on.' : 'AI priority: off (turn it on in Administration > AI priority).'))
  .catch((err) => console.error('Settings setup failed:', err.message))

// Prepare the database for auto-assignment, serve any waiting tickets, then
// re-check every minute as a safety net
assigner
  .ensureSchema()
  .then(() => {
    assigner.dispatch()
    assigner.startSweep(config.dispatchIntervalMs)
  })
  .catch((err) =>
    console.error(
      'Auto-assignment setup failed. Add the columns by hand: ' +
        'ALTER TABLE ticket ADD COLUMN queued TINYINT(1) NOT NULL DEFAULT 0 AFTER assigned_to, ' +
        'ADD COLUMN assigned_at DATETIME NULL AFTER queued;',
      err.message
    )
  )

app.listen(config.port, () => console.log(`Server is running on port ${config.port}`))
