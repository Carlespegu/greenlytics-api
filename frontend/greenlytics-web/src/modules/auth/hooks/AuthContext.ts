import { createContext } from 'react';

import type { AuthState } from '@/types/auth';

export interface AuthContextValue extends AuthState {
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
