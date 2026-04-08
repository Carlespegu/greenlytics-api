import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import DevicesPage from './pages/DevicesPage'
import InstallationsPage from './pages/InstallationsPage'
import InstallationDevicesPage from './pages/InstallationDevicesPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PlantsPage from './pages/PlantsPage'
import ReadingsPage from './pages/ReadingsPage'
import UsersPage from './pages/UsersPage'
import AlertsPage from './pages/AlertsPage'
import AlertDetailPage from './pages/AlertDetailPage'
import SettingsPage from './pages/SettingsPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'devices', element: <DevicesPage /> },
          { path: 'installations', element: <InstallationsPage /> },
          { path: 'installations/:installationId/devices', element: <InstallationDevicesPage /> },
          { path: 'plants', element: <PlantsPage /> },
          { path: 'readings', element: <ReadingsPage /> },
          { path: 'alerts', element: <AlertsPage /> },
          { path: 'alerts/new', element: <AlertDetailPage /> },
          { path: 'alerts/:alertId', element: <AlertDetailPage /> },

          {
            element: <RoleProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: 'clients', element: <ClientsPage /> },
              { path: 'clients/new', element: <ClientDetailPage /> },
              { path: 'clients/:clientId', element: <ClientDetailPage /> },
            ],
          },

          {
            element: <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/dashboard',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/devices',
    element: <Navigate to="/app/devices" replace />,
  },
  {
    path: '/installations',
    element: <Navigate to="/app/installations" replace />,
  },
  {
    path: '/plants',
    element: <Navigate to="/app/plants" replace />,
  },
  {
    path: '/readings',
    element: <Navigate to="/app/readings" replace />,
  },
  {
    path: '/alerts',
    element: <Navigate to="/app/alerts" replace />,
  },
  {
    path: '/alerts/new',
    element: <Navigate to="/app/alerts/new" replace />,
  },
  {
    path: '/clients',
    element: <Navigate to="/app/clients" replace />,
  },
  {
    path: '/clients/new',
    element: <Navigate to="/app/clients/new" replace />,
  },
  {
    path: '/users',
    element: <Navigate to="/app/users" replace />,
  },
  {
    path: '/settings',
    element: <Navigate to="/app/settings" replace />,
  },
])
