import React, { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input, PasswordInput, Button } from '@demonicka/ui';
import { useTranslations } from '../../contexts/LocaleContext';

export default function Register() {
  usePageTitle('Registrace');
  const t = useTranslations<Record<string, unknown>>('auth');
  const registerT = (t.register as Record<string, unknown>) || {};
  const genders = (registerT.genders as Record<string, string>) || {};
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'MALE' as 'MALE' | 'FEMALE'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
      setError((registerT.passwordMismatch as string) ?? 'Hesla se neshodují');
      setIsLoading(false);
      return;
    }

    try {
      const { username, password, gender } = formData;
      await register(username, password, null, gender);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={(registerT.title as string) ?? 'Vytvořte si účet'}
      subtitle={(registerT.subtitle as string) ?? 'Připojte se k nám a začněte svou cestu'}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <div className="mb-5">
            <Input
              id="username"
              name="username"
              type="text"
              label={(registerT.username as string) ?? 'Uživatelské jméno'}
              required
              value={formData.username}
              onChange={handleChange}
              placeholder={(registerT.username as string) ?? 'Uživatelské jméno'}
            />
          </div>
          <div className="mb-5">
            <label 
              htmlFor="gender" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {(registerT.gender as string) ?? 'Pohlaví'}
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleSelectChange}
              className="block w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-[#1a1d24] transition-colors"
              required
            >
              <option value="MALE">{genders.male ?? 'Muž'}</option>
              <option value="FEMALE">{genders.female ?? 'Žena'}</option>
            </select>
          </div>
          <div className="mb-5">
            <PasswordInput
              id="password"
              name="password"
              label={(registerT.password as string) ?? 'Heslo'}
              required
              value={formData.password}
              onChange={handleChange}
              placeholder={(registerT.password as string) ?? 'Heslo'}
            />
          </div>
          <div>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label={(registerT.confirmPassword as string) ?? 'Potvrďte heslo'}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={(registerT.confirmPassword as string) ?? 'Potvrďte heslo'}
              error={error}
            />
          </div>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
          >
            {isLoading ? (registerT.signingUp as string) ?? 'Vytváření účtu...' : (registerT.signUp as string) ?? 'Vytvořit účet'}
          </Button>
        </div>
      </form>

      <div className="text-sm text-center mt-8">
        <Link 
          to="/login" 
          className="font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
        >
          {(registerT.haveAccount as string) ?? 'Již máte účet? Přihlaste se'}
        </Link>
      </div>
    </AuthLayout>
  );
} 