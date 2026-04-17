import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useI18n } from '@/app/i18n/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { applyBackendFormErrors } from '@/shared/forms/applyBackendFormErrors';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { locale, locales, setLocale, t } = useI18n();
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
        setGlobalMessage(t('auth.loginError'));
      }
    }
  });

  return (
    <main className="login-shell">
      <section className="auth-card">
        <div className="auth-card__header-row">
          <span className="auth-card__eyebrow">{t('auth.brand')}</span>
          <label className="auth-language-switcher">
            <span>{t('common.selectLanguage')}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>
              {locales.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <h1>{t('auth.loginTitle')}</h1>
        <p className="page-subtitle">{t('auth.loginSubtitle')}</p>
        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">{t('auth.email')}</label>
            <input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </div>
          <div className="form-field">
            <label htmlFor="password">{t('auth.password')}</label>
            <input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
          </div>
          {errors.root?.server?.message ? <div className="global-error">{errors.root.server.message}</div> : null}
          {globalMessage ? <div className="global-error">{globalMessage}</div> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? t('auth.signingIn') : t('auth.signIn')}</button>
        </form>
      </section>
    </main>
  );
}
