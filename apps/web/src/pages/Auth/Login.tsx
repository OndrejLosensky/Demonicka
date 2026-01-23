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