import type { ReactNode } from 'react';

const variantClassMap = {
  success: 'status-badge status-badge--success',
  warning: 'status-badge status-badge--warning',
  danger: 'status-badge status-badge--danger',
  neutral: 'status-badge status-badge--neutral',
  info: 'status-badge status-badge--info',
} as const;

interface StatusBadgeProps {
  label: string;
  icon?: ReactNode;
  variant?: keyof typeof variantClassMap;
}

export function StatusBadge({ label, icon, variant = 'neutral' }: StatusBadgeProps) {
  return <span className={variantClassMap[variant]}>{icon}<span>{label}</span></span>;
}
