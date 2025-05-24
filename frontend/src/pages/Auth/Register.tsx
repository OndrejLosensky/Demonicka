import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import translations from '../../locales/cs/auth.json';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují');
      setIsLoading(false);
      return;
    }

    try {
      const { username, email, password, firstName, lastName } = formData;
      await register(username, email, password, firstName, lastName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={translations.register.title}
      subtitle={translations.register.subtitle}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <Input
            id="username"
            name="username"
            type="text"
            label={translations.register.username}
            required
            value={formData.username}
            onChange={handleChange}
            placeholder={translations.register.username}
          />
          <Input
            id="email"
            name="email"
            type="email"
            label={translations.register.email}
            required
            value={formData.email}
            onChange={handleChange}
            placeholder={translations.register.email}
          />
          <Input
            id="firstName"
            name="firstName"
            type="text"
            label={translations.register.firstName}
            required
            value={formData.firstName}
            onChange={handleChange}
            placeholder={translations.register.firstName}
          />
          <Input
            id="lastName"
            name="lastName"
            type="text"
            label={translations.register.lastName}
            required
            value={formData.lastName}
            onChange={handleChange}
            placeholder={translations.register.lastName}
          />
          <Input
            id="password"
            name="password"
            type="password"
            label={translations.register.password}
            required
            value={formData.password}
            onChange={handleChange}
            placeholder={translations.register.password}
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label={translations.register.confirmPassword}
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={translations.register.confirmPassword}
            error={error}
          />
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? translations.register.signingUp : translations.register.signUp}
          </Button>
        </div>
      </form>

      <div className="text-sm text-center mt-8 text-text-primary">
        <Link 
          to="/login" 
          className="font-medium text-primary-500 hover:text-primary-600 transition-colors duration-200"
        >
          {translations.register.haveAccount}
        </Link>
      </div>
    </AuthLayout>
  );
} 