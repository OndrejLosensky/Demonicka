import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { toast } from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function EnterToken() {
  usePageTitle('Registrační token');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate token format (you might want to adjust this based on your token format)
      if (!token.trim()) {
        throw new Error('Token je povinný');
      }

      // Redirect to complete registration page with the token
      navigate(`/complete-registration?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Něco se pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zadejte registrační token
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Pro dokončení registrace zadejte token, který jste obdrželi
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="token"
            name="token"
            type="text"
            label="Registrační token"
            required
            placeholder="Zadejte váš registrační token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Zpracovávám...' : 'Pokračovat'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    </div>
  );
} 