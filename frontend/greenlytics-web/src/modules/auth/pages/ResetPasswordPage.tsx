import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useI18n } from '@/app/i18n/LanguageProvider';
import { authApi } from '@/modules/auth/api/authApi';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth';
import { applyBackendFormErrors } from '@/shared/forms/applyBackendFormErrors';

function readRecoveryToken(location: ReturnType<typeof useLocation>) {
  const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : location.hash);
  const searchParams = new URLSearchParams(location.search);

  return hashParams.get('access_token')
    ?? searchParams.get('access_token')
    ?? searchParams.get('token');
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isCompleted, setIsCompleted] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const accessToken = useMemo(() => readRecoveryToken(location), [location]);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!accessToken) {
      setGlobalMessage(t('auth.resetPasswordInvalidLink'));
      return;
    }

    setGlobalMessage(null);

    try {
      await authApi.resetPassword({
        accessToken,
        newPassword: values.password,
      });
      setIsCompleted(true);
      window.history.replaceState({}, document.title, '/reset-password');
    } catch (error) {
      const mapped = applyBackendFormErrors(error, setError);
      if (!mapped) {
        setGlobalMessage(t('auth.resetPasswordError'));
      }
    }
  });

  return (
    <main className="login-shell">
      <section className="auth-card">
        <div className="auth-card__header-row">
          <span className="auth-card__eyebrow">{t('auth.brand')}</span>
          <Link className="auth-inline-link auth-inline-link--back" to="/login">
            <ArrowLeft size={16} />
            <span>{t('auth.backToLogin')}</span>
          </Link>
        </div>

        <h1>{t('auth.resetPasswordTitle')}</h1>
        <p className="page-subtitle">{t('auth.resetPasswordSubtitle')}</p>

        {!accessToken && !isCompleted ? (
          <div className="global-error">{t('auth.resetPasswordInvalidLink')}</div>
        ) : null}

        {isCompleted ? (
          <div className="auth-success">
            <strong>{t('auth.resetPasswordSuccessTitle')}</strong>
            <p>{t('auth.resetPasswordSuccessDescription')}</p>
            <button className="secondary-button" type="button" onClick={() => navigate('/login', { replace: true })}>
              {t('auth.backToLogin')}
            </button>
          </div>
        ) : (
          <form className="form-grid" onSubmit={onSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="password">{t('auth.newPassword')}</label>
              <input id="password" type="password" autoComplete="new-password" {...register('password')} />
              {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword ? <span className="field-error">{errors.confirmPassword.message}</span> : null}
            </div>

            {errors.root?.server?.message ? <div className="global-error">{errors.root.server.message}</div> : null}
            {globalMessage ? <div className="global-error">{globalMessage}</div> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting || !accessToken}>
              {isSubmitting ? t('auth.resettingPassword') : t('auth.resetPasswordAction')}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
