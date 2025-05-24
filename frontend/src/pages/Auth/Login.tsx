import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import translations from '../../locales/cs/auth.json';

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(usernameOrEmail, password);
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
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <Input
            id="usernameOrEmail"
            name="usernameOrEmail"
            type="text"
            label={translations.login.usernameOrEmail}
            autoComplete="username email"
            required
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder={translations.login.usernameOrEmail}
            error={error}
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
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? translations.login.signingIn : translations.login.signIn}
          </Button>
        </div>
      </form>

      <div className="text-sm text-center mt-8 text-text-primary">
        <Link 
          to="/register" 
          className="font-medium text-primary-500 hover:text-primary-600 transition-colors duration-200"
        >
          {translations.login.noAccount}
        </Link>
      </div>
    </AuthLayout>
  );
} 