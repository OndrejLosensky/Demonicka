import { Box, Card, MetricCard, PageLoader, Typography } from '@demonicka/ui';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { userDashboardService } from '../../../services/userDashboardService';
import { Button, Grid } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmojiEvents as TrophyIcon, SportsBar as PongIcon, Timer as TimerIcon } from '@mui/icons-material';

export function UserDashboardEventBeerPong() {
  const { username, id } = useParams<{ username: string; id: string }>();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['userDashboardEventBeerPong', username, id],
    queryFn: () => userDashboardService.getEventBeerPong(username!, id!),
    enabled: Boolean(username && id),
    staleTime: 60_000,
  });

  if (query.isLoading) return <PageLoader message="Načítání Beer Pong statistik..." />;
  if (query.isError || !query.data) {
    return (
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Nepodařilo se načíst Beer Pong statistiky
        </Typography>
      </Card>
    );
  }

  const data = query.data;
  const rounds = data.summary.gamesByRound.map((r) => ({
    round: r.round,
    played: r.gamesPlayed,
    won: r.gamesWon,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Card>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Beer Pong — {data.event.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{data.user.username}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              navigate(
                `/u/${encodeURIComponent(data.user.username)}/dashboard/events/${data.event.id}`,
              );
            }}
            sx={{ minHeight: 32, px: 2, fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Přehled
          </Button>
        </Box>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Výhry / hry"
            value={`${data.summary.gamesWon}/${data.summary.gamesPlayed}`}
            icon={<TrophyIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Win rate"
            value={`${(data.summary.winRate * 100).toFixed(1)}%`}
            icon={<PongIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Průměrná délka hry"
            value={
              data.summary.averageGameDurationSeconds == null
                ? '—'
                : `${Math.round(data.summary.averageGameDurationSeconds)}s`
            }
            icon={<TimerIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Hry podle kola
            </Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rounds} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="round" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="played" name="Odehráno" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="won" name="Vyhráno" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Turnaje
            </Typography>
            {data.tournaments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Žádné turnaje v této události.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {data.tournaments.map((t) => (
                  <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.status}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

