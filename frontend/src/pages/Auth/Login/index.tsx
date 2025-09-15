import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import translations from '../../../locales/cs/auth.json';
import { useLogin } from './index.ts';

const LoginComponent: React.FC = () => {
  usePageTitle('Přihlášení');
  const {
    formData,
    error,
    isLoading,
    handleSubmit,
    handleUsernameChange,
    handlePasswordChange,
  } = useLogin();

  return (
    <AuthLayout
      title={translations.login.title}
      subtitle={translations.login.subtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <Input
          id="username"
          name="username"
          type="text"
          label={translations.login.username}
          autoComplete="username"
          required
          value={formData.username}
          onChange={handleUsernameChange}
          placeholder={translations.login.username}
        />
        <PasswordInput
          id="password"
          name="password"
          label={translations.login.password}
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handlePasswordChange}
          placeholder={translations.login.password}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? translations.login.signingIn : translations.login.signIn}
        </Button>
        <div className="text-center">
          <Link
            to="/register"
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
          >
            {translations.login.noAccount}
          </Link>
        </div>
      </form>

      <div className="flex flex-col space-y-4 text-center mt-8">
        <Link to="/enter-token" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          {translations.login.completeRegistration}
        </Link>
      </div>
    </AuthLayout>
  );
};

import { withPageLoader } from '../../../components/hoc/withPageLoader';

const Login = withPageLoader(LoginComponent);
export default Login;
