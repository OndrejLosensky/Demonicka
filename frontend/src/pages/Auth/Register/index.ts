import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  gender: 'MALE' | 'FEMALE';
}

export interface UseRegisterReturn {
  formData: RegisterFormData;
  error: string;
  isLoading: boolean;
  setError: React.Dispatch<React.SetStateAction<string>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useRegister = (): UseRegisterReturn => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'MALE',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
      const { username, password, gender } = formData;
      await register(username, password, null, gender);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    error,
    isLoading,
    setError,
    handleChange,
    handleSubmit,
  };
};

// Re-export the default component from index.tsx
export { default } from './index.tsx';