import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './assets/component/login'
import ProtectedRoute from './assets/component/protectedRoute'
import Layout from './assets/component/layout'
import StaffDashboard from './assets/component/StaffDashboard'
import Landing from './assets/component/landing'
import ITHome from './assets/component/ITHome'
import AssignedTickets from './assets/component/AssignedTickets'
import AvailableTickets from './assets/component/AvailableTickets'
import AdminHome from './assets/component/AdminHome'
import AllTickets from './assets/component/AllTickets'
import Users from './assets/component/Users'
import Categories from './assets/component/Categories'
import Statistics from './assets/component/Statistics'

const itLinks = [
  { to: '/it', label: 'Dashboard', end: true, icon: 'speedometer2' },
  { to: '/it/available', label: 'Available tickets', icon: 'inbox' },
  { to: '/it/tickets', label: 'Assigned tickets', icon: 'wrench-adjustable' },
]
const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true, icon: 'speedometer2' },
  { to: '/admin/tickets', label: 'All tickets', icon: 'ticket-detailed' },
  { to: '/admin/users', label: 'Users', icon: 'people' },
  { to: '/admin/categories', label: 'Categories', icon: 'tags' },
  { to: '/admin/statistics', label: 'Statistics', icon: 'bar-chart' },
]

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Staff: one page, no sidebar */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/it"
        element={
          <ProtectedRoute role="it_user">
            <Layout title="IT support space" links={itLinks} />
          </ProtectedRoute>
        }
      >
        <Route index element={<ITHome />} />
        <Route path="available" element={<AvailableTickets />} />
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
    </Routes>
  )
}

export default App
