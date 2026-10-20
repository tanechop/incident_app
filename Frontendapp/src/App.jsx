import { Routes, Route} from 'react-router-dom'
import Login from './assets/component/login'
import ProtectedRoute from './assets/component/protectedRoute'
import Layout from './assets/component/layout'
import StaffHome from './assets/component/StaffHome'
import CreateTicket from './assets/component/CreateTicket'
import MyTickets from './assets/component/MyTickets'
import Landing from './assets/component/landing'  
import ITHome from './assets/component/ITHome'
import AssignedTickets from './assets/component/AssignedTickets'
import AdminHome from './assets/component/AdminHome'
import AllTickets from './assets/component/AllTickets'
import Users from './assets/component/Users'
import Categories from './assets/component/Categories'
import Statistics from './assets/component/Statistics'

// import your landing page component here

const staffLinks = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/new', label: 'New ticket' },
  { to: '/dashboard/tickets', label: 'My tickets' },
]
const itLinks = [
  { to: '/it', label: 'Dashboard', end: true },
  { to: '/it/tickets', label: 'Assigned tickets' },
]
const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/tickets', label: 'All tickets' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/statistics', label: 'Statistics' },
]

function App() {
  return (
    <Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute role="staff">
        <Layout title="Staff space" links={staffLinks} />
      </ProtectedRoute>
    }
  >
    <Route index element={<StaffHome />} />
    <Route path="new" element={<CreateTicket />} />
    <Route path="tickets" element={<MyTickets />} />
  </Route>
  <Route
  path="/it"
  element={
    <ProtectedRoute role="it_user">
      <Layout title="IT support space" links={itLinks} />
    </ProtectedRoute>
  }
>
  <Route index element={<ITHome />} />
  <Route path="tickets" element={<AssignedTickets />} />
</Route>
<Route
  path="/admin"
  element={
    <ProtectedRoute role="admin">
      <Layout title="Administration" links={adminLinks} />
    </ProtectedRoute>
  }
>
  <Route index element={<AdminHome />} />
  <Route path="tickets" element={<AllTickets />} />
  <Route path="users" element={<Users />} />
  <Route path="categories" element={<Categories />} />
  <Route path="statistics" element={<Statistics />} />
</Route>
</Routes>)
}

export default App