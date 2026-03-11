import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, Button } from '@demonicka/ui';
import { useTranslations } from '../../contexts/LocaleContext';
import { apiClient } from '../../utils/apiClient';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const t = useTranslations<Record<string, unknown>>('auth');
  const forgotT = (t.forgotPassword as Record<string, string>) || {};

  usePageTitle(forgotT.pageTitle ?? 'Obnovení hesla');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSend = email.trim().toLowerCase();
    setIsLoading(true);
    setSuccess(false);

    try {
      await apiClient.post('/auth/forgot-password', {
        email: emailToSend,
      });
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        (axiosError.response?.status === 429
          ? 'Příliš mnoho žádostí. Zkuste to znovu později.'
          : 'Něco se pokazilo.');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={forgotT.title ?? 'Obnovení hesla'}
      subtitle={forgotT.subtitle ?? 'Zadejte email účtu a pošleme vám kód pro obnovení hesla'}
    >
      {success ? (
        <div className="space-y-5">
          <div className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-100 p-4 rounded-lg text-sm border border-green-300 dark:border-green-700 font-medium">
            {forgotT.successMessageEmailLink ??
              'Pokud účet s tímto emailem existuje, poslali jsme vám email s odkazem pro nastavení nového hesla. Zkontrolujte svou schránku.'}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              id="email"
              name="email"
              type="email"
              label={forgotT.emailLabel ?? 'Email'}
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={forgotT.emailPlaceholder ?? 'vas@email.cz'}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? (forgotT.submitting ?? 'Odesílám...')
              : (forgotT.submit ?? 'Odeslat kód')}
          </Button>
        </form>
      )}

      <div className="text-center mt-6">
        <Link
          to="/login"
          className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {forgotT.backToLogin ?? 'Zpět na přihlášení'}
        </Link>
      </div>
    </AuthLayout>
  );
}
