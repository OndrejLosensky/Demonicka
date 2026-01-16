import { Typography, Grid, Box, IconButton, Tooltip } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon, Speed as SpeedIcon } from '@mui/icons-material';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import { MetricCard } from '../../../components/ui/MetricCard';
import translations from '../../../locales/cs/dashboard.leaderboard.json';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useHeaderVisibility } from '../../../contexts/HeaderVisibilityContext';

const LeaderboardComponent: React.FC = () => {
  usePageTitle('Žebříček');
  const { stats, dashboardStats, publicStats, isLoading } = useLeaderboard();
  const { isHeaderVisible, toggleHeader } = useHeaderVisibility();
  
  // Use real-time stats from WebSocket, fallback to calculated values
  const metricStats = {
    totalBeers: publicStats?.totalBeers || 0,
    averagePerHour: dashboardStats?.averageBeersPerUser || 0, // This will be updated via WebSocket
    totalBarrels: publicStats?.totalBarrels || 0,
    averagePerPerson: (publicStats?.totalUsers && publicStats?.totalBeers) ? publicStats.totalBeers / publicStats.totalUsers : 0,
  };

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
    <Box 
      sx={{ 
        bgcolor: 'background.default',
        width: '100%'
      }}
    >
      <Box 
        p={3} 
        sx={{ 
          pt: isHeaderVisible ? 3 : 0.5
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={isHeaderVisible ? 3 : 1.5} sx={{ position: 'relative' }}>
          {!isHeaderVisible && (
            <Box 
              sx={{
                position: 'absolute',
                top: '-130px',
                left: 0,
                zIndex: 1,
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            >
              <img
                src="/logo.svg"
                alt="Démonická"
                style={{
                  width: '180px',
                  height: '180px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 15px rgba(255,59,48,0.15))'
                }}
              />
            </Box>
          )}
          
          <PageHeader title={translations.title} />
          <Tooltip title={isHeaderVisible ? "Skrýt hlavičku" : "Zobrazit hlavičku"} arrow>
            <IconButton
              onClick={toggleHeader}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
              {isHeaderVisible ? <FullscreenIcon /> : <FullscreenExitIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Metric Cards */}
        <Grid container spacing={isHeaderVisible ? 3 : 2} mb={isHeaderVisible ? 4 : 3}>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title="Celkem piv" 
              value={metricStats.totalBeers} 
              icon={<FaBeer style={{ fontSize: '1rem' }} />} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title="Průměr piv za hodinu" 
              value={metricStats.averagePerHour.toFixed(1)} 
              icon={<SpeedIcon />} 
              color="error" 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title="Počet sudů" 
              value={metricStats.totalBarrels} 
              icon={<FaBeer style={{ fontSize: '1rem' }} />} 
              color="success" 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title="Průměr na osobu" 
              value={metricStats.averagePerPerson.toFixed(1)} 
              icon={<FaBeer style={{ fontSize: '1rem' }} />} 
              color="warning" 
            />
          </Grid>
        </Grid>

        <Grid container spacing={isHeaderVisible ? 4 : 3}>
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
    </Box>
  );
};

const Leaderboard = withPageLoader(LeaderboardComponent);
export default Leaderboard; 