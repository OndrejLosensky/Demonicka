import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, PageLoader } from '@demonicka/ui';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '../../../services/dashboardService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { Container } from '@mui/material';

export function TotalBeersDetail() {
  const { activeEvent } = useActiveEvent();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['kpi-total-beers', activeEvent?.id],
    queryFn: () => dashboardService.getDashboardStats(activeEvent?.id),
    enabled: Boolean(activeEvent),
  });

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState />
      </Container>
    );
  }

  if (isLoading) {
    return <PageLoader message="Načítání dat..." />;
  }

  const timeSeriesData = stats?.topUsers?.slice(0, 10).map((user, idx) => ({
    name: user.username,
    value: user.beerCount,
    rank: idx + 1,
  })) || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ borderRadius: 1, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          Celkem piv - Detail
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Celkem: {stats?.totalBeers || 0} piv ({stats?.totalLitres?.toFixed(1) || '0.0'} L)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Celkový počet vypitých piv v aktivní události
          </Typography>
        </Box>

        <Box sx={{ height: 300, mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Top 10 uživatelů
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="beerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.05} />
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ff3b30"
                fill="url(#beerGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Uživatel</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Počet piv</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>% z celku</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats?.topUsers?.map((user, idx) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell align="right">{user.beerCount}</TableCell>
                  <TableCell align="right">
                    {stats.totalBeers > 0
                      ? `${((user.beerCount / stats.totalBeers) * 100).toFixed(1)}%`
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
