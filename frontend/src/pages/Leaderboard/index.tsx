import { Typography, Grid, Box, IconButton, Tooltip } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon, Speed as SpeedIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import { MetricCard } from '../../components/ui/MetricCard';
import { dashboardService } from '../../services/dashboardService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import translations from '../../locales/cs/dashboard.leaderboard.json';
import { withPageLoader } from '../../components/hoc/withPageLoader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageHeader } from '../../components/ui/PageHeader';
import { useHeaderVisibility } from '../../contexts/HeaderVisibilityContext';

const LeaderboardComponent: React.FC = () => {
  usePageTitle('Žebříček');
  const { stats, isLoading } = useLeaderboard();
  const { activeEvent } = useActiveEvent();
  const { isHeaderVisible, toggleHeader } = useHeaderVisibility();
  const [metricStats, setMetricStats] = useState({
    totalBeers: 0,
    averagePerHour: 0,
    totalBarrels: 0,
    averagePerPerson: 0,
  });

  // Load metric data when component mounts
  useEffect(() => {
    const loadMetricStats = async () => {
      if (activeEvent?.id) {
        try {
          const dashboardData = await dashboardService.getDashboardStats(activeEvent.id);
          const hourlyData = await dashboardService.getHourlyStats(activeEvent.id);
          
          // Calculate average per hour (active hours only)
          const activeHours = hourlyData.filter(h => h.count > 0).length || 1;
          const averagePerHour = hourlyData.reduce((sum, h) => sum + h.count, 0) / activeHours;
          
          setMetricStats({
            totalBeers: dashboardData.totalBeers,
            averagePerHour: averagePerHour,
            totalBarrels: dashboardData.totalBarrels,
            averagePerPerson: dashboardData.totalUsers > 0 ? dashboardData.totalBeers / dashboardData.totalUsers : 0,
          });
        } catch (error) {
          console.error('Failed to load metric stats:', error);
        }
      }
    };

    loadMetricStats();
  }, [activeEvent?.id]);

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
    <Box p={3} sx={{ pt: isHeaderVisible ? 3 : 0.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={isHeaderVisible ? 3 : 1.5}>
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
  );
};

const Leaderboard = withPageLoader(LeaderboardComponent);
export default Leaderboard; 