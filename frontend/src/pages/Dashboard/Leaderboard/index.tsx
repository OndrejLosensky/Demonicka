import React from 'react';
import { Typography, Grid, Box, IconButton, Tooltip, Paper, Chip } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon, Speed as SpeedIcon } from '@mui/icons-material';
import { GiTrophy } from 'react-icons/gi';
import { useLeaderboard, type LeaderboardTableProps } from './index.ts';
import { MetricCard } from '../../../components/ui/MetricCard';
import translations from '../../../locales/cs/dashboard.leaderboard.json';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useHeaderVisibility } from '../../../contexts/HeaderVisibilityContext';

// LeaderboardTable Component
const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ participants = [], title }) => {
  const getTrophyColor = (rank: number): string => {
    switch (rank) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return 'transparent';
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3,
        height: '100%',
        border: '2px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <GiTrophy style={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.4rem' }}>
          {title}
        </Typography>
      </Box>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '12px 16px' }}>
              <Typography color="text.primary" variant="body1" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                {translations.table.columns.rank}
              </Typography>
            </th>
            <th style={{ textAlign: 'left', padding: '12px 16px' }}>
              <Typography color="text.primary" variant="body1" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                {translations.table.columns.name}
              </Typography>
            </th>
            <th style={{ textAlign: 'right', padding: '12px 16px' }}>
              <Typography color="text.primary" variant="body1" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                {translations.table.columns.beers}
              </Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => (
            <tr key={participant.id}>
              <td style={{ padding: '12px 16px', width: '70px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography 
                    variant={index < 3 ? 'h6' : 'body1'} 
                    sx={{ 
                      fontWeight: 900,
                      fontSize: index < 3 ? '1.2rem' : '1rem',
                      color: 'text.primary',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  {index < 3 && (
                    <GiTrophy style={{ 
                      fontSize: '1.2rem',
                      color: getTrophyColor(index)
                    }} />
                  )}
                </Box>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography 
                    variant={index < 3 ? 'h6' : 'body1'}
                    sx={{ 
                      fontWeight: index < 3 ? 900 : 700,
                      fontSize: index < 3 ? '1.2rem' : '1rem',
                      color: 'text.primary',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {participant.username}
                  </Typography>
                  {index === 0 && (
                    <Chip 
                      label={translations.table.champion}
                      size="small"
                      sx={{ 
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        px: 0.8,
                        py: 0.3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    />
                  )}
                </Box>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                  <Typography 
                    variant={index < 3 ? 'h6' : 'body1'}
                    sx={{ 
                      fontWeight: 900,
                      fontSize: index < 3 ? '1.2rem' : '1rem',
                      color: 'text.primary',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {participant.beerCount}
                  </Typography>
                  <FaBeer style={{ 
                    fontSize: index < 3 ? '1.1rem' : '1rem',
                    opacity: index < 3 ? 1 : 0.8,
                    color: index < 3 ? 'primary.main' : 'text.primary',
                  }} />
                </Box>
              </td>
            </tr>
          ))}
          {(!participants || participants.length === 0) && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: '40px 16px' }}>
                <Typography color="text.primary" variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {translations.table.noParticipants}
                </Typography>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Paper>
  );
};

// Main Component
const LeaderboardComponent: React.FC = () => {
  usePageTitle('Žebříček');
  const { stats, dashboardStats, publicStats, isLoading } = useLeaderboard();
  const { isHeaderVisible, toggleHeader } = useHeaderVisibility();
  
  const metricStats = {
    totalBeers: publicStats?.totalBeers || 0,
    averagePerHour: dashboardStats?.averageBeersPerUser || 0,
    totalBarrels: publicStats?.totalBarrels || 0,
    averagePerPerson: (publicStats?.totalUsers && publicStats?.totalBeers) ? publicStats.totalBeers / publicStats.totalUsers : 0,
  };

  if (isLoading) {
    return null;
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
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LeaderboardTable 
              participants={stats.females} 
              title={translations.sections.women}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const Leaderboard = withPageLoader(LeaderboardComponent);
export default Leaderboard;
