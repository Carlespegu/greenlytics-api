import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleProtectedRoute() {
  const { isAuthenticated, canSeeAdminSection } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!canSeeAdminSection) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}