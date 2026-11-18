# IT interfaces redesign (dashboard, Available tickets, Assigned tickets)

Frontendapp/src/assets/component/it.css            NEW  styles, scoped to .it-page
Frontendapp/src/assets/component/itTickets.js      NEW  sort + search helpers
Frontendapp/src/assets/component/ITParts.jsx       NEW  priority/status tags, chips, search box, details panel
Frontendapp/src/assets/component/ITHome.jsx        rewritten
Frontendapp/src/assets/component/AvailableTickets.jsx  rewritten
Frontendapp/src/assets/component/AssignedTickets.jsx   rewritten
Frontendapp/src/services/Format.js                 + timeAgo(), ageHours()
Frontendapp/src/assets/component/TicketDrawer.jsx  import '../../services/Format' (file name case; fixes Linux builds)
No backend change: same API endpoints.
