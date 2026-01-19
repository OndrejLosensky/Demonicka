import { Box, Card, MetricCard, PageLoader, Typography } from '@demonicka/ui';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userDashboardService } from '../../../services/userDashboardService';
import { Grid, Link as MuiLink } from '@mui/material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  LocalBar as BeerIcon,
  Event as EventIcon,
  SportsBar as PongIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { UserDashboardDailyPoint, UserDashboardTopEvent } from '../../../types/userDashboard';

export function UserDashboardOverview() {
  const { username } = useParams<{ username: string }>();

  const query = useQuery({
    queryKey: ['userDashboardOverview', username],
    queryFn: () => userDashboardService.getOverview(username!),
    enabled: Boolean(username),
    staleTime: 60_000,
  });

  if (query.isLoading) return <PageLoader message="Načítání statistik..." />;
  if (query.isError || !query.data) {
    return (
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Nepodařilo se načíst statistiky
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Zkuste to prosím znovu později.
        </Typography>
      </Card>
    );
  }

  const data = query.data;
  const daily: UserDashboardDailyPoint[] = data.daily;
  const topEvents: UserDashboardTopEvent[] = data.topEvents;

  const pieData = topEvents.map((e) => ({
    name: e.eventName,
    value: e.userBeers,
    eventId: e.eventId,
  }));

  const pieColors = ['#7c3aed', '#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {data.user.name ?? data.user.username}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Přehled statistik uživatele @{data.user.username}
        </Typography>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Celkem piv"
            value={data.totals.totalBeers}
            icon={<TrendingIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Piva mimo události"
            value={data.totals.beers}
            icon={<BeerIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Účast v událostech"
            value={data.totals.participatedEvents}
            icon={<EventIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Beer Pong (W/L)"
            value={`${data.beerPong.gamesWon}/${data.beerPong.gamesPlayed}`}
            icon={<PongIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} alignItems="stretch">
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {data.activeEvent
                ? `Piva v čase (${data.activeEvent.isActive ? 'aktivní' : 'poslední'} událost: ${data.activeEvent.name})`
                : 'Piva v čase (bez aktivní události)'}
            </Typography>
            {data.activeEvent ? (
              <Box sx={{ height: 320, flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="consumedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="spilledGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => format(new Date(v), 'dd.MM HH:mm', { locale: cs })}
                      minTickGap={12}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        value,
                        name === 'beers'
                          ? 'Vypito'
                          : name === 'eventBeers'
                            ? 'Rozlité'
                            : 'Celkem',
                      ]}
                      labelFormatter={(label) =>
                        `Čas: ${format(new Date(label), 'PPpp', { locale: cs })}`
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="beers"
                      stroke="#7c3aed"
                      fill="url(#consumedGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="eventBeers"
                      stroke="#f59e0b"
                      fill="url(#spilledGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Žádná aktivní událost.
              </Typography>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Top události (podle tvých piv)
            </Typography>
            {pieData.length ? (
              <Box sx={{ height: 220, flex: 1, minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [v, 'Piv']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Zatím žádná data.
              </Typography>
            )}

            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {topEvents.slice(0, 4).map((e) => (
                <MuiLink
                  key={e.eventId}
                  component={RouterLink}
                  to={`/u/${encodeURIComponent(data.user.username)}/dashboard/events/${e.eventId}`}
                  underline="hover"
                  color="text.primary"
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    '&:visited': { color: 'text.primary' },
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {e.eventName}
                </MuiLink>
              ))}
              <MuiLink
                component={RouterLink}
                to={`/u/${encodeURIComponent(data.user.username)}/dashboard/events`}
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  '&:visited': { color: 'text.secondary' },
                  '&:hover': { color: 'primary.main' },
                }}
              >
                Zobrazit všechny události
              </MuiLink>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

