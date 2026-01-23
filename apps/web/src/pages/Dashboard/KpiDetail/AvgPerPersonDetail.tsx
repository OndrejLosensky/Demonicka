import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, PageLoader } from '@demonicka/ui';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import {
  Bar,
  BarChart,
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

export function AvgPerPersonDetail() {
  const { activeEvent } = useActiveEvent();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['kpi-avg-per-person', activeEvent?.id],
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

  const totalUsers = stats?.totalUsers || 0;
  const totalBeers = stats?.totalBeers || 0;
  const totalLitres = stats?.totalLitres || 0;
  const avgPerPerson = totalUsers > 0 ? totalBeers / totalUsers : 0;
  const avgLitresPerPerson = totalUsers > 0 ? totalLitres / totalUsers : 0;

  const chartData = stats?.topUsers?.slice(0, 10).map((user) => ({
    name: user.username,
    value: user.beerCount,
  })) || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ borderRadius: 1, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          průměr / os. - Detail
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Průměr: {avgPerPerson.toFixed(2)} piv na osobu ({avgLitresPerPerson.toFixed(2)} L)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Celkem: {totalBeers} piv ({totalLitres.toFixed(1)} L) / {totalUsers} účastníků
          </Typography>
        </Box>

        <Box sx={{ height: 300, mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Top 10 uživatelů
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
              <Bar dataKey="value" fill="#ff3b30" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Uživatel</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Počet piv</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Vs. průměr</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats?.topUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell align="right">{user.beerCount}</TableCell>
                  <TableCell align="right">
                    {avgPerPerson > 0
                      ? `${((user.beerCount / avgPerPerson - 1) * 100).toFixed(1)}%`
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
