import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import translations from '../../locales/cs/auth.json';
import { withPageLoader } from '../../components/hoc/withPageLoader';

const LoginComponent: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
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
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
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
        <Input
          id="password"
          name="password"
          type="password"
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
            to="/auth/register"
            className="text-primary hover:text-primary-600 text-sm font-medium"
          >
            {translations.login.noAccount}
          </Link>
        </div>
      </form>

      <div className="flex flex-col space-y-4 text-center mt-8">
        <Link to="/register" className="text-sm text-indigo-600 hover:text-indigo-500">
          Nemáte účet? Zaregistrujte se
        </Link>
        <Link to="/enter-token" className="text-sm text-indigo-600 hover:text-indigo-500">
          Máte registrační token? Dokončete registraci
        </Link>
      </div>
    </AuthLayout>
  );
};

const Login = withPageLoader(LoginComponent);
export default Login; 