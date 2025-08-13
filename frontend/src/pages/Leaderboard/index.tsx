import { Typography, Grid, Box, Paper } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import translations from '../../locales/cs/dashboard.leaderboard.json';
import { withPageLoader } from '../../components/hoc/withPageLoader';

const LeaderboardComponent: React.FC = () => {
  const { stats, isLoading } = useLeaderboard();

  if (isLoading) {
    return null; // withPageLoader will handle loading state
  }

  if (!stats) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>{translations.noData}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3, 
          textAlign: 'center',
          background: 'transparent',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <FaBeer style={{ fontSize: '2rem' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {translations.title}
          </Typography>
          <FaBeer style={{ fontSize: '2rem' }} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LeaderboardTable 
            participants={stats.males} 
            title={translations.sections.men}
            icon={<FaBeer style={{ fontSize: '1.5rem' }} />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LeaderboardTable 
            participants={stats.females} 
            title={translations.sections.women}
            icon={<FaBeer style={{ fontSize: '1.5rem' }} />}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

const Leaderboard = withPageLoader(LeaderboardComponent);
export default Leaderboard; 