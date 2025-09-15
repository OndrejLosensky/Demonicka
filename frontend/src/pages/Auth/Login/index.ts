import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export interface LoginFormData {
  username: string;
  password: string;
}

export interface UseLoginReturn {
  formData: LoginFormData;
  error: string;
  isLoading: boolean;
  setFormData: React.Dispatch<React.SetStateAction<LoginFormData>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useLogin = (): UseLoginReturn => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, username: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, password: e.target.value }));
  };

  return {
    formData,
    error,
    isLoading,
    setFormData,
    setError,
    handleSubmit,
    handleUsernameChange,
    handlePasswordChange,
  };
};

// Re-export the default component from index.tsx
export { default } from './index.tsx';