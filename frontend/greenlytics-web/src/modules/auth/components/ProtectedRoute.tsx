import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useAuthorization } from '@/hooks/useAuthorization';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import type { AppRole } from '@/types/auth';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, accessToken, isBootstrapping } = useAuth();
  const location = useLocation();
  const isAuthorized = useAuthorization(allowedRoles);

  if (isBootstrapping) {
    return <LoadingScreen label="Initializing your V3 workspace..." />;
  }

  if (!accessToken || !user?.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
