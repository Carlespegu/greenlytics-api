import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { useI18n } from '@/app/i18n/LanguageProvider';
import { authApi } from '@/modules/auth/api/authApi';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth';
import { applyBackendFormErrors } from '@/shared/forms/applyBackendFormErrors';

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGlobalMessage(null);

    try {
      await authApi.forgotPassword({
        email: values.email,
        redirectUrl: `${window.location.origin}/reset-password`,
      });
      setIsSubmitted(true);
    } catch (error) {
      const mapped = applyBackendFormErrors(error, setError);
      if (!mapped) {
        setGlobalMessage(t('auth.forgotPasswordError'));
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

        <h1>{t('auth.forgotPasswordTitle')}</h1>
        <p className="page-subtitle">{t('auth.forgotPasswordSubtitle')}</p>

        {isSubmitted ? (
          <div className="auth-success">
            <strong>{t('auth.forgotPasswordSuccessTitle')}</strong>
            <p>{t('auth.forgotPasswordSuccessDescription')}</p>
          </div>
        ) : (
          <form className="form-grid" onSubmit={onSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">{t('auth.email')}</label>
              <input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
            </div>

            {errors.root?.server?.message ? <div className="global-error">{errors.root.server.message}</div> : null}
            {globalMessage ? <div className="global-error">{globalMessage}</div> : null}

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('auth.sendingRecoveryEmail') : t('auth.sendRecoveryEmail')}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
