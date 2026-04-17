import type { BackendValidationError } from '@/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string | null;
  readonly validationErrors: BackendValidationError[];

  constructor(params: {
    message: string;
    status: number;
    errorCode?: string | null;
    validationErrors?: BackendValidationError[] | null;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.errorCode = params.errorCode ?? null;
    this.validationErrors = params.validationErrors ?? [];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
