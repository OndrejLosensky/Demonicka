import { Typography, Grid, Box } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import translations from '../../locales/cs/dashboard.leaderboard.json';
import { withPageLoader } from '../../components/hoc/withPageLoader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageHeader } from '../../components/ui/PageHeader';

const LeaderboardComponent: React.FC = () => {
  usePageTitle('Žebříček');
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
      <PageHeader title={translations.title} />

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