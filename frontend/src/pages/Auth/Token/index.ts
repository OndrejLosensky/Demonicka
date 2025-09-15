import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { userService } from '../../../services/userService';

// EnterToken logic
export interface UseEnterTokenReturn {
  token: string;
  isLoading: boolean;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  navigateToLogin: () => void;
}

export const useEnterToken = (): UseEnterTokenReturn => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!token.trim()) {
        throw new Error('Token je povinný');
      }
      navigate(`/complete-registration?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  return {
    token,
    isLoading,
    setToken,
    handleSubmit,
    handleTokenChange,
    navigateToLogin,
  };
};

// CompleteRegistration logic
export interface CompleteRegistrationFormData {
  username: string;
  password: string;
}

export interface UseCompleteRegistrationReturn {
  formData: CompleteRegistrationFormData;
  token: string | null;
  isLoading: boolean;
  isLoadingUsername: boolean;
  hasValidToken: boolean;
  setFormData: React.Dispatch<React.SetStateAction<CompleteRegistrationFormData>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useCompleteRegistration = (): UseCompleteRegistrationReturn => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { completeRegistration } = useAuth();

  const [formData, setFormData] = useState<CompleteRegistrationFormData>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsername, setIsLoadingUsername] = useState(true);

  useEffect(() => {
    if (token) {
      loadUsernameFromToken();
    }
  }, [token]);

  const loadUsernameFromToken = async () => {
    try {
      setIsLoadingUsername(true);
      const { username: tokenUsername } = await userService.getUsernameFromToken(token!);
      setFormData(prev => ({ ...prev, username: tokenUsername }));
    } catch (error) {
      console.error('Error loading username from token:', error);
      toast.error('Nepodařilo se načíst uživatelské jméno z tokenu');
    } finally {
      setIsLoadingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await completeRegistration(token!, formData.username, formData.password);
      toast.success('Registrace byla úspěšně dokončena!');
    } catch (error) {
      console.error('Error completing registration:', error);
      toast.error('Nepodařilo se dokončit registraci. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, password: e.target.value }));
  };

  return {
    formData,
    token,
    isLoading,
    isLoadingUsername,
    hasValidToken: !!token,
    setFormData,
    handleSubmit,
    handlePasswordChange,
  };
};

// Re-export components from index.tsx
export { EnterToken, CompleteRegistration } from './index.tsx';
