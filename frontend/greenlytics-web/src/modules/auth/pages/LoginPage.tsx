import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { applyBackendFormErrors } from '@/shared/forms/applyBackendFormErrors';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const onSubmit = handleSubmit(async (values) => {
    setGlobalMessage(null);
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      const mapped = applyBackendFormErrors(error, setError);
      if (!mapped) {
        setGlobalMessage('Unable to log in right now. Please try again.');
      }
    }
  });

  return (
    <main className="login-shell">
      <section className="auth-card">
        <span className="auth-card__eyebrow">GreenLytics V3</span>
        <h1>Sign in to the new control center</h1>
        <p className="page-subtitle">This frontend is built around the V3 auth flow, `/auth/me`, rich validation errors and role-aware navigation.</p>
        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
          </div>
          {errors.root?.server?.message ? <div className="global-error">{errors.root.server.message}</div> : null}
          {globalMessage ? <div className="global-error">{globalMessage}</div> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}
