# Admin dashboard changes

## Files (copy over your project)
server/index.js                                  runs the users migration at startup
server/services/schema.service.js                NEW - adds users.category_id if missing
server/services/user.service.js                  category on create + list (joined name)
server/services/category.service.js              clears users.category_id when a category is deleted
server/services/stats.service.js                 extra data for the charts
Frontendapp/src/assets/component/AdminHome.jsx   search + status chips + charts
Frontendapp/src/assets/component/AdminHome.css   chart / search styles
Frontendapp/src/assets/component/AdminCharts.jsx NEW - dependency-free charts (no npm install)
Frontendapp/src/assets/component/Users.jsx       category field, search, role filter

## Database
Added automatically on server start. Manual equivalent:
  ALTER TABLE users ADD COLUMN category_id INT NULL AFTER role, ADD INDEX idx_users_category (category_id);

## Admin can no longer assign tickets
server/routes/ticket.routes.js        removed PUT /tickets/:id/assign
server/controllers/ticket.controller.js  removed assign handler
server/services/ticket.service.js     removed assignTicket()
Frontendapp/.../AllTickets.jsx        "Assigned to" is now read-only text (with a "Waiting" badge for queued tickets)
Tickets are assigned only by the automatic dispatcher, or when an IT user takes one in charge.

## Search moved to "All tickets"; Statistics removed from the sidebar
Frontendapp/src/assets/component/AdminHome.jsx   search bar, status chips and result tables removed (charts stay)
Frontendapp/src/assets/component/AllTickets.jsx  search bar + status chips (replace the old status dropdown)
Frontendapp/src/App.jsx                          "Statistics" link removed from the admin sidebar
