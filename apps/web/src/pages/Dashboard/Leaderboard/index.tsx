import { useState, useEffect, useMemo } from 'react';
import { Typography, Grid, Box, IconButton, Tooltip, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon, Speed as SpeedIcon, MetricCard, PageHeader, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@demonicka/ui';
import { FaBeer } from 'react-icons/fa';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import translations from '../../../locales/cs/dashboard.leaderboard.json';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { useHeaderVisibility } from '../../../contexts/HeaderVisibilityContext';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import { eventService } from '../../../services/eventService';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import type { Event } from '@demonicka/shared-types';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const LeaderboardComponent: React.FC = () => {
  const { stats, dashboardStats, publicStats, isLoading } = useLeaderboard();
  const { isHeaderVisible, toggleHeader } = useHeaderVisibility();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const showYearFilter = useFeatureFlag(FeatureFlagKey.LEADERBOARD_YEAR_FILTER);
  const { selectedEvent, setSelectedEvent } = useSelectedEvent();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const e of events) {
      const y = new Date(e.startDate).getFullYear();
      if (!Number.isNaN(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [events]);

  // Handle fullscreen API
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!showYearFilter) return;
    const loadEvents = async () => {
      try {
        const data = await eventService.getAllEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events for year filter:', error);
      }
    };
    loadEvents();
  }, [showYearFilter]);

  useEffect(() => {
    if (!showYearFilter) return;
    // Initialize selected year from currently selected event (if any)
    if (!selectedYear && selectedEvent?.startDate) {
      const y = new Date(selectedEvent.startDate).getFullYear();
      if (!Number.isNaN(y)) setSelectedYear(y);
    }
  }, [showYearFilter, selectedYear, selectedEvent?.id]);
  
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
        width: '100%',
        maxWidth: '1400px',
        mx: 'auto',
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
                }}
              />
            </Box>
          )}
          
          <PageHeader title={translations.title} />
          <Box display="flex" gap={1} alignItems="center">
            {showYearFilter && availableYears.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="leaderboard-year-label">Rok</InputLabel>
                <Select
                  labelId="leaderboard-year-label"
                  label="Rok"
                  value={selectedYear}
                  onChange={(e) => {
                    const year = e.target.value === '' ? '' : Number(e.target.value);
                    setSelectedYear(year);
                    if (year === '') return;
                    const candidates = events
                      .filter((ev) => new Date(ev.startDate).getFullYear() === year)
                      .sort(
                        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
                      );
                    if (candidates[0]) {
                      setSelectedEvent(candidates[0]);
                    }
                  }}
                >
                  {availableYears.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Tooltip title={isHeaderVisible ? "Skrýt hlavičku" : "Zobrazit hlavičku"} arrow>
              <IconButton
                onClick={toggleHeader}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                {isHeaderVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Ukončit celou obrazovku" : "Celá obrazovka"} arrow>
              <IconButton
                onClick={toggleFullscreen}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
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