import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import DevicesPage from './pages/DevicesPage'
import InstallationsPage from './pages/InstallationsPage'
import LoginPage from './pages/LoginPage'
import PlantsPage from './pages/PlantsPage'

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
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'devices',
            element: <DevicesPage />,
          },
          {
            path: 'installations',
            element: <InstallationsPage />,
          },
          {
            path: 'plants',
            element: <PlantsPage />,
          },
        ],
      },
    ],
  },
])