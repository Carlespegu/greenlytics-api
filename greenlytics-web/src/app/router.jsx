import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import DevicesPage from './pages/DevicesPage'
import InstallationsPage from './pages/InstallationsPageV2'
import InstallationDevicesPage from './pages/InstallationDevicesPage'
import LoginPage from './pages/LoginPage'
import PlantsPage from './pages/PlantsPageV2'
import ReadingsPage from './pages/ReadingsPage'
import UsersPage from './pages/UsersPage'
import AlertsPage from './pages/AlertsPage'
import AlertDetailPage from './pages/AlertDetailPage'
import SettingsPage from './pages/SettingsPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
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
])
