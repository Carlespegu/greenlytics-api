import type { AppRole } from '@/types/auth';

export interface NavigationItem {
  labelKey: string;
  iconKey: string;
  to: string;
  roles: AppRole[];
}

export interface NavigationSection {
  labelKey: string;
  items: NavigationItem[];
}
