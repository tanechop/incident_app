# Ticket emails

server/services/emailTemplate.js        NEW  builds subject + text + HTML email from a ticket
server/services/notification.service.js     loads the full ticket and sends it (attachment included)
server/config/env.js                        optional APP_URL
server/test/emailTemplate.test.js       NEW  7 tests

Optional .env line (adds an "Open the platform" button):
APP_URL=http://localhost:5173
