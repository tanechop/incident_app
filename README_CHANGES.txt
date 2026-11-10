AUTOMATIC TICKET ASSIGNMENT - what is in this zip
=================================================

Copy these folders over your project (keep your .env, uploads/, node_modules/
and package.json files):

  server/                      new layered backend (routes / controllers / services)
  Frontendapp/src/assets/component/AssignedTickets.jsx   queued badge + waiting message
  Frontendapp/src/assets/component/TicketDrawer.jsx      clearer note for staff

Delete the old server/index.js logic: the new server/index.js replaces it.

RULES
  1. A tech is available when he has no open / in_progress ticket on hand.
  2. Several free techs: fewest tickets handled first (even spread).
  3. Nobody free: ticket is queued on the first tech (lowest id).
  4. When any tech finishes, a waiting ticket moves to whoever is free first.
  High priority tickets are served before older low priority ones.

DATABASE
  Two columns are added to table "ticket" automatically at startup
  (queued, assigned_at). If your DB user cannot ALTER, run:
    ALTER TABLE ticket
      ADD COLUMN queued TINYINT(1) NOT NULL DEFAULT 0 AFTER assigned_to,
      ADD COLUMN assigned_at DATETIME NULL AFTER queued;

TESTS (from the server folder)
  node --test test/ticketAssignment.test.js test/dispatcher.test.js test/errorHandling.test.js

OPTIONAL .env
  PORT=3000
  DISPATCH_INTERVAL_MS=60000
