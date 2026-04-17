import { httpClient } from '@/shared/api/httpClient';
import type { CurrentUser, LoginResult } from '@/types/auth';

interface LoginRequest {
  email: string;
  password: string;
}

function normalizeCurrentUser(user: CurrentUser): CurrentUser {
  return {
    ...user,
    roleCode: user.roleCode.toUpperCase() as CurrentUser['roleCode'],
  };
}

export const authApi = {
  login: async (payload: LoginRequest) => {
    const result = await httpClient.post<LoginResult>('/auth/login', payload, { accessToken: null });

    return {
      ...result,
      user: normalizeCurrentUser(result.user),
    };
  },
  me: async (accessToken?: string | null) => normalizeCurrentUser(await httpClient.get<CurrentUser>('/auth/me', { accessToken })),
};
