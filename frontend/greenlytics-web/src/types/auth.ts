export type AppRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface CurrentUser {
  userId: string;
  username: string;
  email: string;
  roleId: string;
  roleCode: AppRole;
  roleName: string;
  clientId: string;
  clientName?: string | null;
  isActive: boolean;
  isAuthenticated: boolean;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: CurrentUser;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
}
