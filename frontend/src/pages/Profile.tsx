import { Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatsComponent } from '../components/UserStats';

export const Profile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const userId = id || user.id;

  return (
    <Box>
      <UserStatsComponent userId={userId} />
    </Box>
  );
}; 