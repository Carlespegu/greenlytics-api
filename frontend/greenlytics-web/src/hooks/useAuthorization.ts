import type { AppRole } from '@/types/auth';

import { useAuth } from '@/hooks/useAuth';

export function useAuthorization(allowedRoles?: AppRole[]) {
  const { user } = useAuth();

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return user ? allowedRoles.includes(user.roleCode) : false;
}
