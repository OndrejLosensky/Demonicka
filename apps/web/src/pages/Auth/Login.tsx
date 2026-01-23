import React, { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, PasswordInput, Button } from '@demonicka/ui';
import translations from '../../locales/cs/auth.json';
import { withPageLoader } from '../../components/hoc/withPageLoader';

const LoginComponent: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithTwoFactor } = useAuth();
  usePageTitle('Přihlášení');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (requiresTwoFactor) {
        // Second step: submit 2FA code
        await loginWithTwoFactor(username, password, twoFactorCode);
        setRequiresTwoFactor(false);
        setTwoFactorCode('');
      } else {
        // First step: submit username/password
        const result = await login(username, password);
        if (result?.requiresTwoFactor) {
          setRequiresTwoFactor(true);
        }
      }
    } catch (err: any) {
      if (err?.response?.data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Něco se pokazilo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={translations.login.title}
      subtitle={translations.login.subtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        <div>
          <div className="mb-5">
            <Input
              id="username"
              name="username"
              type="text"
              label={translations.login.username}
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={translations.login.username}
            />
          </div>
          <div>
            <PasswordInput
              id="password"
              name="password"
              label={translations.login.password}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={translations.login.password}
              disabled={requiresTwoFactor}
            />
          </div>
        </div>
        {requiresTwoFactor && (
          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
              Kód pro dvoufázové ověření byl odeslán na váš email. Zadejte 6místný kód.
            </div>
            <Input
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              label="Kód pro dvoufázové ověření"
              autoComplete="one-time-code"
              required
              value={twoFactorCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFactorCode(value);
              }}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || (requiresTwoFactor && twoFactorCode.length !== 6)}
        >
          {isLoading
            ? requiresTwoFactor
              ? 'Ověřuji...'
              : translations.login.signingIn
            : requiresTwoFactor
            ? 'Ověřit a přihlásit'
            : translations.login.signIn}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              nebo
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const apiPrefix = import.meta.env.VITE_API_PREFIX || '/api';
            window.location.href = `${apiUrl}${apiPrefix}/auth/google`;
          }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Přihlásit se přes Google
        </Button>

        <div className="text-center">
          <Link
            to="/register"
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
          >
            {translations.login.noAccount}
          </Link>
        </div>
        <div className="text-center pt-2">
          <Link 
            to="/enter-token" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {translations.login.completeRegistration}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

const Login = withPageLoader(LoginComponent);
export default Login; 