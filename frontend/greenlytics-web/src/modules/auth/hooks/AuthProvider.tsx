import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import { authApi } from '@/modules/auth/api/authApi';
import { AuthContext } from '@/modules/auth/hooks/AuthContext';
import { clearStoredTokens, getStoredAccessToken, getStoredRefreshToken, storeTokens } from '@/shared/auth/tokenStorage';
import type { AuthState } from '@/types/auth';

const initialState: AuthState = {
  accessToken: getStoredAccessToken(),
  refreshToken: getStoredRefreshToken(),
  user: null,
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialState);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function refreshCurrentUser() {
    const token = state.accessToken ?? getStoredAccessToken();

    if (!token) {
      setState((current) => ({ ...current, user: null, accessToken: null, refreshToken: null }));
      clearStoredTokens();
      return;
    }

    const user = await authApi.me(token);
    setState((current) => ({ ...current, accessToken: token, user }));
  }

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const user = await authApi.me(token);
        setState({ accessToken: token, refreshToken, user });
      } catch {
        clearStoredTokens();
        setState({ accessToken: null, refreshToken: null, user: null });
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  async function login(email: string, password: string) {
    const result = await authApi.login({ email, password });
    storeTokens(result.accessToken, result.refreshToken);
    setState({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
  }

  function logout() {
    clearStoredTokens();
    setState({ accessToken: null, refreshToken: null, user: null });
  }

  return <AuthContext.Provider value={{ ...state, isBootstrapping, login, logout, refreshCurrentUser }}>{children}</AuthContext.Provider>;
}
