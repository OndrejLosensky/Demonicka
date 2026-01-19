import { Box, Card, PageLoader, Typography } from '@demonicka/ui';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { userDashboardService } from '../../../services/userDashboardService';
import { Button, Chip, Grid } from '@mui/material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

export function UserDashboardEvents() {
  const { username } = useParams<{ username: string }>();
  const query = useQuery({
    queryKey: ['userDashboardEvents', username],
    queryFn: () => userDashboardService.getEvents(username!),
    enabled: Boolean(username),
    staleTime: 60_000,
  });

  if (query.isLoading) return <PageLoader message="Načítání událostí..." />;
  if (query.isError || !query.data) {
    return (
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Nepodařilo se načíst události
        </Typography>
      </Card>
    );
  }

  const data = query.data;
  const events = data.events;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Události
        </Typography>
        <Typography variant="body2" color="text.secondary">
          @{data.user.username} — přehled účasti a statistik
        </Typography>
      </Card>

      {events.length === 0 ? (
        <Card>
          <Typography variant="body2" color="text.secondary">
            Zatím žádná účast v událostech.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {events.map((e) => (
            <Grid key={e.eventId} item xs={12} md={6}>
              <Card>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {e.eventName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(e.startDate), 'PPp', { locale: cs })}
                      {e.endDate ? ` → ${format(new Date(e.endDate), 'PPp', { locale: cs })}` : ''}
                    </Typography>
                  </Box>
                  {e.isActive && <Chip label="Aktivní" color="success" size="small" />}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  <Chip label={`Moje piva: ${e.userBeers}`} variant="outlined" />
                  <Chip label={`Celkem: ${e.totalEventBeers}`} variant="outlined" />
                  <Chip label={`Podíl: ${e.sharePercent.toFixed(1)}%`} variant="outlined" />
                  {e.userSpilledBeers > 0 && <Chip label={`Rozlité: ${e.userSpilledBeers}`} color="warning" size="small" />}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Button
                    component={RouterLink}
                    to={`/u/${encodeURIComponent(data.user.username)}/dashboard/events/${e.eventId}`}
                    variant="contained"
                    size="small"
                    sx={{ minHeight: 32, px: 2, fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Detail
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

