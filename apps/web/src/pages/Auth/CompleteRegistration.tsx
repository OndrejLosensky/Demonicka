import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { toast } from 'react-hot-toast';
import { userService } from '../../services/userService';
import { Input, PasswordInput, Button } from '@demonicka/ui';

export function CompleteRegistration() {
  usePageTitle('Dokončení registrace');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { completeRegistration } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      setUsername(tokenUsername);
    } catch (error) {
      console.error('Error loading username from token:', error);
      toast.error('Nepodařilo se načíst uživatelské jméno z tokenu');
    } finally {
      setIsLoadingUsername(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Neplatný odkaz</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tento odkaz pro dokončení registrace je neplatný. Kontaktujte prosím organizátora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await completeRegistration(token, username, password);
      toast.success('Registrace byla úspěšně dokončena!');
    } catch (error) {
      console.error('Error completing registration:', error);
      toast.error('Nepodařilo se dokončit registraci. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dokončení registrace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vytvořte si své přihlašovací údaje pro přístup do aplikace
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="username"
            name="username"
            type="text"
            label="Uživatelské jméno"
            required
            value={isLoadingUsername ? 'Načítám...' : username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            placeholder="Uživatelské jméno"
            disabled={true}
          />
          {isLoadingUsername && (
            <p className="text-sm text-gray-500 -mt-1">Načítám uživatelské jméno...</p>
          )}
          <p className="text-sm text-gray-500 -mt-1">Uživatelské jméno nelze změnit - je určeno vaším registračním tokenem</p>
          <PasswordInput
            id="password"
            name="password"
            label="Heslo"
            required
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Heslo"
            disabled={isLoading || isLoadingUsername}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLoadingUsername}
          >
            {isLoading ? 'Dokončuji registraci...' : 'Dokončit registraci'}
          </Button>
        </form>
      </div>
    </div>
  );
} 