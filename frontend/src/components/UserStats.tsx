import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { UserStats } from '../types/stats';
import { UserStatsService } from '../services/UserStatsService';

interface UserStatsProps {
  userId: string;
}

export const UserStatsComponent: React.FC<UserStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await UserStatsService.getUserStats(userId);
        setStats(data);
      } catch (error) {
        setError('Failed to load statistics');
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box p={4}>
        <Typography color="error">{error || 'No data available'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
      <Grid container spacing={3}>
        {/* Overall Stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h5" gutterBottom>
                Celkové statistiky
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1">Celkem piv</Typography>
                  <Typography variant="h4">{stats.totalBeers}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1">Průměr za den</Typography>
                  <Typography variant="h4">
                    {stats.averageBeersPerDay.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1">Průměr na akci</Typography>
                  <Typography variant="h4">
                    {stats.averageBeersPerEvent.toFixed(1)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1">Globální pořadí</Typography>
                  <Typography variant="h4">
                    {stats.globalRank}. / {stats.totalUsers}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h5" gutterBottom>
                Nedávná aktivita
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Za poslední hodinu</Typography>
                  <Typography variant="h4">{stats.beersLastHour}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Dnes</Typography>
                  <Typography variant="h4">{stats.beersToday}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Tento týden</Typography>
                  <Typography variant="h4">{stats.beersThisWeek}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Tento měsíc</Typography>
                  <Typography variant="h4">{stats.beersThisMonth}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Records */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h5" gutterBottom>
                Časové rekordy
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">První pivo</Typography>
                  <Typography variant="body1">
                    {stats.firstBeerDate
                      ? format(new Date(stats.firstBeerDate), 'PPpp', { locale: cs })
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Poslední pivo</Typography>
                  <Typography variant="body1">
                    {stats.lastBeerDate
                      ? format(new Date(stats.lastBeerDate), 'PPpp', { locale: cs })
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Nejdelší pauza</Typography>
                  <Typography variant="h4">{stats.longestBreak}h</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Nejvíce za den</Typography>
                  <Typography variant="h4">{stats.mostBeersInDay}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Distribution Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h5" gutterBottom>
                Rozložení během dne
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} piv`,
                        'Počet',
                      ]}
                      labelFormatter={(hour: number) => `${hour}:00`}
                    />
                    <Bar
                      dataKey="count"
                      fill={theme.palette.primary.main}
                      name="Počet piv"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Stats Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h5" gutterBottom>
                Posledních 30 dní
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        format(new Date(date), 'd.M.', { locale: cs })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} piv`,
                        'Počet',
                      ]}
                      labelFormatter={(date: string) =>
                        format(new Date(date), 'PPP', { locale: cs })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={theme.palette.primary.main}
                      name="Počet piv"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Event Stats */}
        {stats.eventStats.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" gutterBottom>
                  Statistiky akcí
                </Typography>
                <Grid container spacing={2}>
                  {stats.eventStats.map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.eventId}>
                      <Box
                        p={2}
                        border={1}
                        borderColor="divider"
                        borderRadius={1}
                      >
                        <Typography variant="h6">{event.eventName}</Typography>
                        <Typography variant="body1">
                          Počet piv: {event.beerCount}
                        </Typography>
                        <Typography variant="body1">
                          Pořadí: {event.rank}. / {event.totalParticipants}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 