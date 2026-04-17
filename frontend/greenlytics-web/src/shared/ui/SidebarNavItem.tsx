import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarNavItemProps {
  collapsed?: boolean;
  to: string;
  label: string;
  icon: ReactNode;
  isMatch: (pathname: string) => boolean;
  pathname: string;
}

export function SidebarNavItem({ collapsed = false, to, label, icon, isMatch, pathname }: SidebarNavItemProps) {
  return (
    <NavLink
      aria-label={label}
      className={({ isActive }) => `sidebar-nav-item${collapsed ? ' sidebar-nav-item--collapsed' : ''}${isActive || isMatch(pathname) ? ' sidebar-nav-item--active' : ''}`}
      title={label}
      to={to}
    >
      <span className="sidebar-nav-item__icon">{icon}</span>
      {!collapsed ? <span className="sidebar-nav-item__label">{label}</span> : null}
    </NavLink>
  );
}
