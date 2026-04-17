import type { NavigationSection } from '@/types/navigation';

export const navigationSections: NavigationSection[] = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', to: '/dashboard', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { label: 'Plants', to: '/plants/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { label: 'Installations', to: '/installations/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { label: 'Devices', to: '/devices/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { label: 'Alerts', to: '/alerts/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { label: 'Readings', to: '/readings/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', to: '/users/search', roles: ['ADMIN', 'MANAGER'] },
      { label: 'Clients', to: '/clients/search', roles: ['ADMIN'] },
      { label: 'Settings', to: '/settings', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
];
