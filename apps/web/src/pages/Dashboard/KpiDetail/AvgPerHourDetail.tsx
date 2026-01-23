import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, PageLoader } from '@demonicka/ui';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Line,
  LineChart,
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

export function AvgPerHourDetail() {
  const { activeEvent } = useActiveEvent();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['kpi-avg-per-hour', activeEvent?.id],
    queryFn: () => dashboardService.getDashboardStats(activeEvent?.id),
    enabled: Boolean(activeEvent),
  });

  const { data: hourly } = useQuery({
    queryKey: ['kpi-avg-per-hour-hourly', activeEvent?.id],
    queryFn: () => dashboardService.getHourlyStats(activeEvent!.id, format(new Date(), 'yyyy-MM-dd')),
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

  const normalize24Hours = (data: typeof hourly) => {
    if (!data) return [];
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const existingHours = data.map((h) => h.hour);
    const missingHours = allHours.filter((hour) => !existingHours.includes(hour));
    return [
      ...data,
      ...missingHours.map((hour) => ({ hour, count: 0 })),
    ].sort((a, b) => a.hour - b.hour);
  };

  const chartData = normalize24Hours(hourly).map((h) => ({
    hour: h.hour,
    label: `${h.hour.toString().padStart(2, '0')}:00`,
    count: h.count,
  }));

  const totalBeers = stats?.totalBeers || 0;
  const totalLitres = stats?.totalLitres || 0;
  const eventStart = activeEvent?.createdAt ? new Date(activeEvent.createdAt) : new Date();
  const hoursSinceStart = Math.max(1, (Date.now() - eventStart.getTime()) / (1000 * 60 * 60));
  const avgPerHour = totalBeers / hoursSinceStart;
  const avgLitresPerHour = totalLitres / hoursSinceStart;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ borderRadius: 1, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          Průměr / hod - Detail
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Průměr: {avgPerHour.toFixed(2)} piv/hod ({avgLitresPerHour.toFixed(2)} L/hod)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Celkem: {totalBeers} piv ({totalLitres.toFixed(1)} L) za {hoursSinceStart.toFixed(1)} hodin
          </Typography>
        </Box>

        <Box sx={{ height: 400 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Spotřeba během dne
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="label" minTickGap={10} />
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
              <Line type="monotone" dataKey="count" stroke="#ff3b30" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
}
