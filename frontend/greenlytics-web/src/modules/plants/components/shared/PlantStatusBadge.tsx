import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantStatusBadgeProps {
  status: string | null | undefined;
}

function resolveStatusVariant(status: string | null | undefined) {
  const normalizedStatus = (status ?? '').trim().toLowerCase();
  if (!normalizedStatus) {
    return 'neutral' as const;
  }
  if (normalizedStatus.includes('alert') || normalizedStatus.includes('risk')) {
    return 'warning' as const;
  }
  if (normalizedStatus.includes('healthy') || normalizedStatus.includes('stable')) {
    return 'success' as const;
  }
  return 'info' as const;
}

export function PlantStatusBadge({ status }: PlantStatusBadgeProps) {
  return <StatusBadge label={status ?? 'Unknown'} variant={resolveStatusVariant(status)} />;
}
