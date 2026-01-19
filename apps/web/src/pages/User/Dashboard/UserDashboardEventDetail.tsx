import { Box, Card, MetricCard, PageLoader, Typography } from '@demonicka/ui';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { userDashboardService } from '../../../services/userDashboardService';
import { Button, Grid } from '@mui/material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LocalBar as BeerIcon, Percent as PercentIcon, Warning as WarningIcon } from '@mui/icons-material';

export function UserDashboardEventDetail() {
  const { username, id } = useParams<{ username: string; id: string }>();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['userDashboardEventDetail', username, id],
    queryFn: () => userDashboardService.getEventDetail(username!, id!),
    enabled: Boolean(username && id),
    staleTime: 60_000,
  });

  if (query.isLoading) return <PageLoader message="Načítání detailu události..." />;
  if (query.isError || !query.data) {
    return (
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Nepodařilo se načíst detail události
        </Typography>
      </Card>
    );
  }

  const data = query.data;
  const hourly = data.hourly.map((h) => ({
    t: new Date(h.bucketUtc),
    count: h.count,
    spilled: h.spilled,
  }));

  let cumulative = 0;
  const chartData = hourly.map((h) => {
    const total = h.count + h.spilled;
    cumulative += total;
    return {
      label: format(h.t, 'dd.MM HH:00', { locale: cs }),
      count: h.count,
      spilled: h.spilled,
      cumulative,
    };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Card>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {data.event.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(new Date(data.event.startDate), 'PPp', { locale: cs })}
              {data.event.endDate ? ` → ${format(new Date(data.event.endDate), 'PPp', { locale: cs })}` : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              navigate(
                `/u/${encodeURIComponent(data.user.username)}/dashboard/events/${data.event.id}/beer-pong`,
              );
            }}
            sx={{ minHeight: 32, px: 2, fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Beer Pong
          </Button>
        </Box>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Moje piva" value={data.summary.userBeers} icon={<BeerIcon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Podíl" value={`${data.summary.sharePercent.toFixed(1)}%`} icon={<PercentIcon />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Rozlité" value={data.summary.userSpilledBeers} icon={<WarningIcon />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Celkem v události" value={data.summary.totalEventBeers} color="info" />
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Hodinový průběh (v okně události)
          </Typography>
        </Box>
        <Box sx={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="label" interval="preserveStartEnd" angle={-30} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Vypito" stackId="a" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              <Bar dataKey="spilled" name="Rozlité" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Kumulativně"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
}

