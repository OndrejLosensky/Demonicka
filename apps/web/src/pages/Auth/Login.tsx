import React, { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import translations from '../../locales/cs/auth.json';
import { withPageLoader } from '../../components/hoc/withPageLoader';

const LoginComponent: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  usePageTitle('Přihlášení');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

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
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={translations.login.username}
        />
        <PasswordInput
          id="password"
          name="password"
          label={translations.login.password}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

const Login = withPageLoader(LoginComponent);
export default Login; 