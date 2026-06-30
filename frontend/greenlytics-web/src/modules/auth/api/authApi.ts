import { httpClient } from '@/shared/api/httpClient';
import type { CurrentUser, LoginResult } from '@/types/auth';

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshRequest {
  refreshToken: string;
}

interface ForgotPasswordRequest {
  email: string;
  redirectUrl: string;
}

interface ResetPasswordRequest {
  accessToken: string;
  newPassword: string;
}

function normalizeCurrentUser(user: CurrentUser): CurrentUser {
  return {
    ...user,
    roleCode: user.roleCode.toUpperCase() as CurrentUser['roleCode'],
  };
}

export const authApi = {
  login: async (payload: LoginRequest) => {
    const result = await httpClient.post<LoginResult>('/auth/login', payload, {
      accessToken: null,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      ...result,
      user: normalizeCurrentUser(result.user),
    };
  },
  refresh: async (payload: RefreshRequest) => httpClient.post<LoginResult>('/auth/refresh', payload, {
    accessToken: null,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  forgotPassword: async (payload: ForgotPasswordRequest) => httpClient.post<void>('/auth/forgot-password', payload, { accessToken: null }),
  resetPassword: async (payload: ResetPasswordRequest) => httpClient.post<void>('/auth/reset-password', payload, { accessToken: null }),
  me: async (accessToken?: string | null) => normalizeCurrentUser(await httpClient.get<CurrentUser>('/auth/me', { accessToken })),
};
