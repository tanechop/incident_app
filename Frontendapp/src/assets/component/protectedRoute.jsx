import { Navigate } from 'react-router-dom'

// Where each role lands after login
const homeOf = { staff: '/dashboard', it_user: '/it', admin: '/admin' }

const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  // Not logged in -> login page
  if (!token || !userRole) return <Navigate to="/login" replace />

  // Logged in but on a page of another role -> send to their own space
  if (userRole !== role) return <Navigate to={homeOf[userRole] || '/login'} replace />

  return children
}

export default ProtectedRoute
