import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { isApiError } from '@/shared/api/errors';

export function applyBackendFormErrors<TFieldValues extends FieldValues>(error: unknown, setError: UseFormSetError<TFieldValues>) {
  if (!isApiError(error)) {
    return false;
  }

  if (error.validationErrors.length === 0) {
    setError('root.server' as Path<TFieldValues>, { type: 'server', message: error.message });
    return true;
  }

  for (const validationError of error.validationErrors) {
    const target = validationError.field || 'root.server';
    setError(target as Path<TFieldValues>, { type: validationError.code, message: validationError.message });
  }

  return true;
}
