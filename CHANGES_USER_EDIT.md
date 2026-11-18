# Editable users (admin)

server/services/user.service.js          NEW updateUser() with validation
server/controllers/user.controller.js    NEW update handler
server/routes/user.routes.js             NEW PUT /users/:id (admin only)
server/middleware/auth.js                role now read from the DB on every request
Frontendapp/.../Users.jsx                "Edit" button + edit dialog

Rules enforced by the server
- name and email required, email must stay unique
- password optional (empty = keep the current one), min 6 characters
- an admin cannot change their own role
- an IT user who still holds open / in-progress tickets cannot be moved to another role
- category must exist (or be empty)
