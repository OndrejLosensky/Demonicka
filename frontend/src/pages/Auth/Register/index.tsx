import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import translations from '../../../locales/cs/auth.json';
import { useRegister } from './index.ts';

const Register: React.FC = () => {
  usePageTitle('Registrace');
  const {
    formData,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  } = useRegister();

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
          <div className="space-y-1">
            <label 
              htmlFor="gender" 
              className="block text-sm font-medium text-text-primary dark:text-text-dark-primary"
            >
              {translations.register.gender}
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-dark-primary text-text-primary dark:text-text-dark-primary bg-background-card dark:bg-background-dark-card"
              required
            >
              <option value="MALE">{translations.register.genders.male}</option>
              <option value="FEMALE">{translations.register.genders.female}</option>
            </select>
          </div>
          <PasswordInput
            id="password"
            name="password"
            label={translations.register.password}
            required
            value={formData.password}
            onChange={handleChange}
            placeholder={translations.register.password}
          />
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
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
};

export default Register;
