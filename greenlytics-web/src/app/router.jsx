import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import DevicesPage from './pages/DevicesPage'
import InstallationsPage from './pages/InstallationsPage'
import LoginPage from './pages/LoginPage'
import PlantsPage from './pages/PlantsPage'
import ReadingsPage from './pages/ReadingsPage'
import UsersPage from './pages/UsersPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'

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
          { index: true, element: <DashboardPage /> },
          { path: 'devices', element: <DevicesPage /> },
          { path: 'installations', element: <InstallationsPage /> },
          { path: 'plants', element: <PlantsPage /> },
          { path: 'readings', element: <ReadingsPage /> },

          {
            element: <RoleProtectedRoute />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'alerts', element: <AlertsPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])