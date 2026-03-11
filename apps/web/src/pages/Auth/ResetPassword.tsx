import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, PasswordInput, Button } from '@demonicka/ui';
import { useTranslations } from '../../contexts/LocaleContext';
import { apiClient } from '../../utils/apiClient';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';

interface LocationState {
  email?: string;
}

export function ResetPassword() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateEmail = (location.state as LocationState)?.email;
  const emailFromUrl = searchParams.get('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const t = useTranslations<Record<string, unknown>>('auth');
  const resetT = (t.resetPassword as Record<string, string>) || {};

  useEffect(() => {
    if (stateEmail) setEmail(stateEmail);
    else if (emailFromUrl) setEmail(decodeURIComponent(emailFromUrl));
  }, [stateEmail, emailFromUrl]);

  usePageTitle(resetT.pageTitle ?? 'Nastavení nového hesla');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(resetT.confirmPasswordMismatch ?? 'Hesla se neshodují');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Heslo musí mít alespoň 8 znaků');
      return;
    }
    if (code.length !== 6) {
      toast.error('Kód musí mít 6 číslic');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code,
        newPassword,
      });
      toast.success('Heslo bylo úspěšně změněno. Můžete se přihlásit.');
      navigate('/login');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ??
        'Neplatný nebo vypršený kód. Zkuste to znovu.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={resetT.title ?? 'Nastavení nového hesla'}
      subtitle={
        resetT.subtitle ?? 'Zadejte kód z emailu a nové heslo'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
          id="email"
          name="email"
          type="email"
          label={resetT.emailLabel ?? 'Email'}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={resetT.emailPlaceholder ?? 'vas@email.cz'}
          disabled={isLoading}
        />
        </div>
        <div>
        <Input
          id="code"
          name="code"
          type="text"
          label={resetT.codeLabel ?? 'Kód z emailu'}
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);
          }}
          placeholder={resetT.codePlaceholder ?? '000000'}
          inputMode="numeric"
          disabled={isLoading}
        />
        </div>
        <div>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          label={resetT.newPasswordLabel ?? 'Nové heslo'}
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={resetT.newPasswordLabel ?? 'Nové heslo'}
          disabled={isLoading}
        />
        </div>
        <div>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label={resetT.confirmPasswordLabel ?? 'Potvrďte heslo'}
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={resetT.confirmPasswordLabel ?? 'Potvrďte heslo'}
          disabled={isLoading}
        />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? (resetT.submitting ?? 'Ukládám...')
            : (resetT.submit ?? 'Změnit heslo')}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/login"
          className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {resetT.backToLogin ?? 'Zpět na přihlášení'}
        </Link>
      </div>
    </AuthLayout>
  );
}
