import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, PageLoader } from '@demonicka/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { dashboardService } from '../../../services/dashboardService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { Container } from '@mui/material';
import { UserAvatar } from '../../../components/UserAvatar';

type ChartType = 'bar' | 'line';
type ViewMode = 'top' | 'all';

export function TopUsersDetail() {
  const { activeEvent } = useActiveEvent();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [viewMode, setViewMode] = useState<ViewMode>('top');

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['top-users-detail-stats', activeEvent?.id],
    queryFn: () => dashboardService.getDashboardStats(activeEvent?.id),
    enabled: Boolean(activeEvent),
  });

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['top-users-detail-leaderboard', activeEvent?.id],
    queryFn: () => dashboardService.getLeaderboard(activeEvent!.id),
    enabled: Boolean(activeEvent),
  });

  const allUsers = useMemo(() => {
    if (!leaderboard) return [];
    return [...(leaderboard.males || []), ...(leaderboard.females || [])]
      .sort((a, b) => b.beerCount - a.beerCount)
      .map((user, idx) => ({ ...user, rank: idx + 1 }));
  }, [leaderboard]);

  const topUsers = useMemo(() => allUsers.slice(0, 10), [allUsers]);
  const displayUsers = useMemo(() => (viewMode === 'top' ? topUsers : allUsers), [viewMode, topUsers, allUsers]);

  const chartData = useMemo(
    () =>
      topUsers.map((user) => ({
        name: user.username,
        value: user.beerCount,
        rank: user.rank,
      })),
    [topUsers],
  );

  // Mock history data - showing progression over time (simulated)
  const historyData = useMemo(() => {
    if (!topUsers.length) return [];
    const hours = Array.from({ length: 12 }, (_, i) => i);
    return hours.map((hour) => {
      const dataPoint: Record<string, number | string> = {
        hour: `${hour.toString().padStart(2, '0')}:00`,
      };
      topUsers.forEach((user) => {
        // Simulate progression: earlier hours have fewer beers
        const progress = Math.max(0, (user.beerCount * (hour + 1)) / 12);
        dataPoint[user.username] = Math.floor(progress);
      });
      return dataPoint;
    });
  }, [topUsers]);

  const totalUsers = useMemo(() => allUsers.length, [allUsers]);
  const totalBeers = useMemo(() => allUsers.reduce((sum, u) => sum + u.beerCount, 0), [allUsers]);
  const avgPerUser = useMemo(() => (totalUsers > 0 ? totalBeers / totalUsers : 0), [totalUsers, totalBeers]);

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState />
      </Container>
    );
  }

  if (isLoadingStats || isLoadingLeaderboard) {
    return <PageLoader message="Načítání dat..." />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ borderRadius: 1, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          Nejlepší uživatelé - Detail
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Celkem uživatelů: {totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Počet účastníků v události
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Celkem piv: {totalBeers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vypito celkem všemi uživateli
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Průměr: {avgPerUser.toFixed(1)} piv
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Průměrný počet piv na uživatele
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Top 10 uživatelů
            </Typography>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(_, newValue) => newValue && setChartType(newValue)}
              size="small"
            >
              <ToggleButton value="bar">Sloupcový</ToggleButton>
              <ToggleButton value="line">Čárový</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="beerBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Piv']}
                    contentStyle={{
                      backgroundColor: isDark ? '#11161c' : '#ffffff',
                      border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
                      borderRadius: '4px',
                      color: isDark ? '#e6e8ee' : '#1a1a1a',
                    }}
                    labelStyle={{
                      color: isDark ? '#b8bcc7' : '#5f6368',
                    }}
                  />
                  <Bar dataKey="value" fill="url(#beerBarGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Piv']}
                    contentStyle={{
                      backgroundColor: isDark ? '#11161c' : '#ffffff',
                      border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
                      borderRadius: '4px',
                      color: isDark ? '#e6e8ee' : '#1a1a1a',
                    }}
                    labelStyle={{
                      color: isDark ? '#b8bcc7' : '#5f6368',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#ff3b30" strokeWidth={2} dot={{ fill: '#ff3b30', r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Průběh žebříčku
            </Typography>
          </Box>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#11161c' : '#ffffff',
                    border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
                    borderRadius: '4px',
                    color: isDark ? '#e6e8ee' : '#1a1a1a',
                  }}
                  labelStyle={{
                    color: isDark ? '#b8bcc7' : '#5f6368',
                  }}
                />
                <Legend />
                {topUsers.slice(0, 5).map((user, idx) => {
                  const colors = ['#ff3b30', '#ff6a64', '#ff9999', '#ffb3b3', '#ffcccc'];
                  return (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={user.username}
                      stroke={colors[idx] || '#ff3b30'}
                      strokeWidth={2}
                      dot={false}
                      name={user.username}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {viewMode === 'top' ? 'Top 10 uživatelů' : 'Všichni uživatelé'}
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newValue) => newValue && setViewMode(newValue)}
            size="small"
          >
            <ToggleButton value="top">Top 10</ToggleButton>
            <ToggleButton value="all">Všichni</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Uživatel</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Počet piv</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Rozlité</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>% z celku</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        bgcolor: user.rank === 1 ? 'primary.main' : 'transparent',
                        color: user.rank === 1 ? 'white' : 'text.secondary',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {user.rank}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <UserAvatar
                        user={{
                          username: user.username,
                          profilePictureUrl: user.profilePictureUrl,
                          name: user.username,
                        }}
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      />
                      <Typography sx={{ fontWeight: 600 }}>{user.username}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {user.beerCount}
                  </TableCell>
                  <TableCell align="right" color="text.secondary">
                    {user.spilledCount || 0}
                  </TableCell>
                  <TableCell align="right" color="text.secondary">
                    {totalBeers > 0
                      ? `${((user.beerCount / totalBeers) * 100).toFixed(1)}%`
                      : '0%'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
