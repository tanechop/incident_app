# AI priority (Gemini) - set up from the web page

No file to edit. As admin:
1. Open Administration > AI priority.
2. Paste your Gemini key (free at https://aistudio.google.com/apikey).
3. Click "Test connection", then turn the switch on and "Save settings".

The key is stored encrypted in the database (AES-256-GCM, derived from JWT_SECRET) and never sent back
to the browser. If JWT_SECRET is changed later, paste the key again.
GEMINI_API_KEY in .env still works as a fallback.

## New / changed files
server/services/ai.service.js          Gemini call, clear error messages, check() for the test button
server/services/vault.js               NEW  encrypts the key
server/services/aiSettings.rules.js    NEW  input checks
server/services/settings.service.js    NEW  saved settings, cache, test connection
server/services/prioritizer.js         follows the saved settings
server/services/schema.service.js      + app_settings table, ticket.priority_source / priority_reason (automatic)
server/controllers/settings.controller.js, server/routes/settings.routes.js   NEW  /api/settings/ai
server/routes/index.js, server/index.js, server/config/env.js, server/services/ticket.service.js
server/test/ai.test.js, server/test/settingsRules.test.js   tests (40 in total)
Frontendapp: AISettings.jsx (NEW), App.jsx (sidebar link + route), StaffDashboard.jsx
(no Priority field when AI is on), ITParts.jsx, AllTickets.jsx, TicketDrawer.jsx, it.css
