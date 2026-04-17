import type { AppRole } from '@/types/auth';

export interface NavigationItem {
  label: string;
  to: string;
  roles: AppRole[];
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}
