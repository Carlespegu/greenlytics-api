import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleProtectedRoute({ allowedRoles = ['ADMIN', 'MANAGER'] }) {
  const { isAuthenticated, roleCode } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const normalizedRole = (roleCode || '').toUpperCase()
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase())

  if (!normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}