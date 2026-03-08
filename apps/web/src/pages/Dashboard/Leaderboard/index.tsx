import { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, Grid, Box, IconButton, Tooltip, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon, Speed as SpeedIcon, MetricCard, PageHeader, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Button } from '@demonicka/ui';
import { FaBeer } from 'react-icons/fa';
import { LeaderboardTable } from './LeaderboardTable';
import { BeerPongStandings } from './BeerPongStandings';
import { useLeaderboard } from './useLeaderboard';
import { useLeaderboardViewSettings } from './useLeaderboardViewSettings';
import { useTranslations } from '../../../contexts/LocaleContext';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { useHeaderVisibility } from '../../../contexts/HeaderVisibilityContext';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import { eventService } from '../../../services/eventService';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { beerPongService } from '../../../services/beerPongService';
import type { Event } from '@demonicka/shared-types';
import { FormControl, InputLabel, MenuItem, Select, ButtonGroup } from '@mui/material';

const LeaderboardComponent: React.FC = () => {
  const { stats, dashboardStats, publicStats, isLoading } = useLeaderboard();
  const { isHeaderVisible, toggleHeader } = useHeaderVisibility();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const showYearFilter = useFeatureFlag(FeatureFlagKey.LEADERBOARD_YEAR_FILTER);
  const showAutoSwitch = useFeatureFlag(FeatureFlagKey.LEADERBOARD_AUTO_SWITCH);
  const { selectedEvent, setSelectedEvent } = useSelectedEvent();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const { settings } = useLeaderboardViewSettings();
  const { activeEvent } = useActiveEvent();
  const beerPongAllowed = activeEvent?.beerPongEnabled === true;
  const t = useTranslations<Record<string, unknown>>('dashboard.leaderboard');
  const sections = (t.sections as Record<string, string>) || {};
  const tooltips = (t.tooltips as Record<string, string>) || {};
  const metrics = (t.metrics as Record<string, string>) || {};
  const filters = (t.filters as Record<string, { label?: string }>) || {};

  // View state
  const [currentView, setCurrentView] = useState<'LEADERBOARD' | 'BEER_PONG'>('LEADERBOARD');
  const switchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedView = useRef(false);
  const timerSettingsRef = useRef<{ interval: number; enabled: boolean; mode: string } | null>(null);
  
  // Pre-load beer pong data if auto-switch is enabled
  const [beerPongTournaments, setBeerPongTournaments] = useState<any[]>([]);
  const [beerPongLoading, setBeerPongLoading] = useState(false);

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

  // Pre-load beer pong tournaments if auto-switch is enabled
  useEffect(() => {
    if (!showAutoSwitch || !settings || !settings.autoSwitchEnabled || !activeEvent?.id) {
      return;
    }

    // Pre-load beer pong tournaments in the background
    const loadTournaments = async () => {
      try {
        setBeerPongLoading(true);
        const tournaments = await beerPongService.getActiveTournaments(activeEvent.id);
        setBeerPongTournaments(tournaments);
        console.log('[Leaderboard] Pre-loaded beer pong tournaments:', tournaments.length);
      } catch (error) {
        console.error('[Leaderboard] Failed to pre-load beer pong tournaments:', error);
      } finally {
        setBeerPongLoading(false);
      }
    };

    loadTournaments();
  }, [showAutoSwitch, settings?.autoSwitchEnabled, activeEvent?.id]);

  // Initialize view from settings when they load
  useEffect(() => {
    if (!settings) {
      console.log('[Leaderboard] Settings not loaded yet');
      return;
    }
    
    if (hasInitializedView.current) {
      console.log('[Leaderboard] View already initialized');
      return;
    }
    
    console.log('[Leaderboard] Initializing view from settings:', {
      currentView: settings.currentView,
      autoSwitchEnabled: settings.autoSwitchEnabled,
    });
    
    if (settings.currentView === 'BEER_PONG' && beerPongAllowed) {
      setCurrentView('BEER_PONG');
    } else if (settings.currentView === 'LEADERBOARD') {
      setCurrentView('LEADERBOARD');
    } else if (settings.currentView === 'AUTO') {
      setCurrentView('LEADERBOARD'); // Start with leaderboard in AUTO mode
    } else if (settings.currentView === 'BEER_PONG' && !beerPongAllowed) {
      setCurrentView('LEADERBOARD'); // Beer pong disabled for this event
    }
    
    hasInitializedView.current = true;
  }, [settings, beerPongAllowed]);

  // Auto-switch logic - separate effect that only runs when settings change
  useEffect(() => {
    if (!showAutoSwitch || !settings) {
      // Clear timer if feature is disabled
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
        switchTimerRef.current = null;
      }
      return;
    }

    // If auto-switch is disabled in settings, don't start timer
    if (!settings.autoSwitchEnabled) {
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
        switchTimerRef.current = null;
      }
      // Set view based on settings
      if (settings.currentView === 'LEADERBOARD') {
        setCurrentView('LEADERBOARD');
      } else if (settings.currentView === 'BEER_PONG' && beerPongAllowed) {
        setCurrentView('BEER_PONG');
      } else {
        setCurrentView('LEADERBOARD');
      }
      return;
    }

    // Handle AUTO mode or manual mode
    if (settings.currentView === 'AUTO') {
      // Start auto-switching (only to BEER_PONG if beer pong is enabled for event)
      const interval = Math.max(5000, settings.switchIntervalSeconds * 1000); // Minimum 5 seconds
      
      // Only restart timer if settings actually changed
      const currentTimerSettings = timerSettingsRef.current;
      if (
        currentTimerSettings &&
        currentTimerSettings.interval === interval &&
        currentTimerSettings.enabled === settings.autoSwitchEnabled &&
        currentTimerSettings.mode === 'AUTO' &&
        switchTimerRef.current
      ) {
        // Timer already running with same settings, don't restart
        return;
      }

      // Clear any existing timer first
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
        switchTimerRef.current = null;
      }

      console.log('[Leaderboard] Starting auto-switch timer:', {
        interval: interval,
        intervalSeconds: settings.switchIntervalSeconds,
      });

      // Store current timer settings
      timerSettingsRef.current = {
        interval,
        enabled: settings.autoSwitchEnabled,
        mode: 'AUTO',
      };

      // Start the timer - switch to BEER_PONG only when allowed for this event
      switchTimerRef.current = setInterval(() => {
        setCurrentView((prev) => {
          if (prev === 'LEADERBOARD' && beerPongAllowed) {
            console.log('[Leaderboard] Auto-switching view: LEADERBOARD -> BEER_PONG');
            return 'BEER_PONG';
          }
          if (prev === 'BEER_PONG') {
            console.log('[Leaderboard] Auto-switching view: BEER_PONG -> LEADERBOARD');
            return 'LEADERBOARD';
          }
          return prev;
        });
      }, interval);
    } else if (settings.currentView === 'LEADERBOARD') {
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
        switchTimerRef.current = null;
      }
      timerSettingsRef.current = null;
      setCurrentView('LEADERBOARD');
    } else if (settings.currentView === 'BEER_PONG') {
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
        switchTimerRef.current = null;
      }
      timerSettingsRef.current = null;
      setCurrentView(beerPongAllowed ? 'BEER_PONG' : 'LEADERBOARD');
    }

    return () => {
      if (switchTimerRef.current) {
        clearInterval(switchTimerRef.current);
        switchTimerRef.current = null;
      }
    };
  }, [showAutoSwitch, settings?.autoSwitchEnabled, settings?.currentView, settings?.switchIntervalSeconds, beerPongAllowed]);
  
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
        <Typography>{(t.noData as string) ?? 'Žádná data k dispozici.'}</Typography>
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
          
          <PageHeader title={(t.title as string) ?? 'Žebříček piv'} />
          <Box display="flex" gap={1} alignItems="center">
            {isHeaderVisible && showAutoSwitch && settings && settings.autoSwitchEnabled && (
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={currentView === 'LEADERBOARD' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentView('LEADERBOARD')}
                >
                  {(t.viewLeaderboard as string) ?? 'Žebříček'}
                </Button>
                {beerPongAllowed && (
                <Button
                  variant={currentView === 'BEER_PONG' ? 'contained' : 'outlined'}
                  onClick={() => setCurrentView('BEER_PONG')}
                >
                  {(t.viewBeerPong as string) ?? 'Beer Pong'}
                </Button>
                )}
              </ButtonGroup>
            )}
            {showYearFilter && availableYears.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="leaderboard-year-label">{filters.year?.label ?? 'Rok'}</InputLabel>
                <Select
                  labelId="leaderboard-year-label"
                  label={filters.year?.label ?? 'Rok'}
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
            <Tooltip title={isHeaderVisible ? (tooltips.hideHeader ?? "Skrýt hlavičku") : (tooltips.showHeader ?? "Zobrazit hlavičku")} arrow>
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
            <Tooltip title={isFullscreen ? (tooltips.exitFullscreen ?? "Ukončit celou obrazovku") : (tooltips.fullscreen ?? "Celá obrazovka")} arrow>
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
              title={metrics.totalBeers ?? 'Celkem piv'} 
              value={metricStats.totalBeers} 
              icon={<FaBeer style={{ fontSize: '1rem' }} />} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title={metrics.averagePerHour ?? 'Průměr piv za hodinu'} 
              value={metricStats.averagePerHour.toFixed(1)} 
              icon={<SpeedIcon />} 
              color="error" 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title={metrics.totalBarrels ?? 'Počet sudů'} 
              value={metricStats.totalBarrels} 
              icon={<FaBeer style={{ fontSize: '1rem' }} />} 
              color="success" 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard 
              title={metrics.averagePerPerson ?? 'průměr / os.'} 
              value={metricStats.averagePerPerson.toFixed(1)} 
              icon={<FaBeer style={{ fontSize: '1rem' }} />} 
              color="warning" 
            />
          </Grid>
        </Grid>

        {showAutoSwitch && settings && settings.autoSwitchEnabled && currentView === 'BEER_PONG' && beerPongAllowed ? (
          <Grid container spacing={isHeaderVisible ? 4 : 3}>
            <Grid item xs={12}>
              <BeerPongStandings 
                selectedTournamentId={settings.selectedBeerPongEventId}
                preloadedTournaments={beerPongTournaments}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={isHeaderVisible ? 4 : 3}>
            <Grid item xs={12} md={6}>
              <LeaderboardTable 
                participants={stats.males} 
                title={sections.men ?? 'Pivopíči'}
                icon={<FaBeer style={{ fontSize: '1.5rem' }} />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LeaderboardTable 
                participants={stats.females} 
                title={sections.women ?? 'Pivopíčky'}
                icon={<FaBeer style={{ fontSize: '1.5rem' }} />}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

const Leaderboard = withPageLoader(LeaderboardComponent);
export default Leaderboard; 