import type { NavigationSection } from '@/types/navigation';

export const navigationSections: NavigationSection[] = [
  {
    labelKey: 'nav.core',
    items: [
      { labelKey: 'nav.dashboard', iconKey: 'Dashboard', to: '/dashboard', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { labelKey: 'nav.plants', iconKey: 'Plants', to: '/plants/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { labelKey: 'nav.installations', iconKey: 'Installations', to: '/installations/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { labelKey: 'nav.devices', iconKey: 'Devices', to: '/devices/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { labelKey: 'nav.alerts', iconKey: 'Alerts', to: '/alerts/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
      { labelKey: 'nav.readings', iconKey: 'Readings', to: '/readings/search', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    ],
  },
  {
    labelKey: 'nav.administration',
    items: [
      { labelKey: 'nav.users', iconKey: 'Users', to: '/users/search', roles: ['ADMIN', 'MANAGER'] },
      { labelKey: 'nav.clients', iconKey: 'Clients', to: '/clients/search', roles: ['ADMIN'] },
      { labelKey: 'nav.settings', iconKey: 'Settings', to: '/settings', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
];
