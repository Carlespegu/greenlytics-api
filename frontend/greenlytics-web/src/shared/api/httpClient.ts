import { apiConfig } from '@/shared/api/config';
import { ApiError } from '@/shared/api/errors';
import { getStoredAccessToken } from '@/shared/auth/tokenStorage';
import type { ApiEnvelope } from '@/types/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  accessToken?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  const accessToken = options.accessToken ?? getStoredAccessToken();
  const isFormData = options.body instanceof FormData;
  const requestBody: BodyInit | null | undefined = options.body === undefined
    ? undefined
    : isFormData
      ? options.body as FormData
      : JSON.stringify(options.body);

  if (!isFormData && !headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    ...options,
    headers,
    body: requestBody,
  });

  const payload = response.status === 204 ? null : (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new ApiError({
      message: payload?.message ?? 'Unexpected API error.',
      status: response.status,
      errorCode: payload?.errorCode,
      validationErrors: payload?.errors,
    });
  }

  if (!payload) {
    throw new ApiError({ message: 'Empty API response.', status: response.status });
  }

  return payload.data;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
