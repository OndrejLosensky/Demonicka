import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageLoader } from '@demonicka/ui';
import { toast } from 'react-hot-toast';

export function GoogleCallback() {
  usePageTitle('Google přihlášení');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (hasProcessed) return;

    if (error) {
      toast.error('Přihlášení přes Google se nezdařilo');
      navigate('/login');
      setHasProcessed(true);
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('access_token', token);
      
      // Refresh user data in context
      refreshUser()
        .then(() => {
          setHasProcessed(true);
        })
        .catch(() => {
          toast.error('Nepodařilo se načíst uživatelská data');
          navigate('/login');
          setHasProcessed(true);
        });
    } else {
      toast.error('Chybí autentifikační token');
      navigate('/login');
      setHasProcessed(true);
    }
  }, [searchParams, navigate, refreshUser, hasProcessed]);

  // Redirect when user is loaded
  useEffect(() => {
    if (hasProcessed && user) {
      // Redirect based on user role
      if (user.role === 'USER') {
        navigate(`/${user.id}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, hasProcessed, navigate]);

  return <PageLoader />;
}
