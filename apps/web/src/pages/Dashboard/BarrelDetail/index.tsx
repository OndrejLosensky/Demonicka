import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, PageLoader } from '@demonicka/ui';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
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
import { barrelService } from '../../../services/barrelService';
import { dashboardService } from '../../../services/dashboardService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { Container } from '@mui/material';
import type { BarrelPrediction } from '@demonicka/shared-types';

function formatEta(asOfIso: string, emptyAtIso: string): { relative: string; absolute: string } {
  const asOf = new Date(asOfIso).getTime();
  const emptyAt = new Date(emptyAtIso).getTime();
  const diffMs = Math.max(0, emptyAt - asOf);
  const totalMinutes = Math.round(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const relative = h > 0 ? `${h} h ${m} min` : `${m} min`;
  const d = new Date(emptyAtIso);
  const absolute = `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  return { relative, absolute };
}

export function BarrelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeEvent } = useActiveEvent();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const { data: barrel, isLoading: isLoadingBarrel } = useQuery({
    queryKey: ['barrel-detail', id],
    queryFn: () => barrelService.getById(id!),
    enabled: Boolean(id),
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['barrel-detail-stats', activeEvent?.id],
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

  if (isLoadingBarrel) {
    return <PageLoader message="Načítání dat..." />;
  }

  if (!barrel) {
    return (
      <Container>
        <Typography variant="h6">Sud nenalezen</Typography>
      </Container>
    );
  }

  const total = Math.max(0, barrel.totalBeers || 0);
  const remaining = Math.max(0, barrel.remainingBeers || 0);
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const pctLabel = total > 0 ? `${Math.round(pct * 100)}%` : '—';

  const prediction = dashboardStats?.barrelPrediction?.barrel.id === barrel.id 
    ? dashboardStats.barrelPrediction 
    : undefined;

  const currentEta = prediction?.eta?.emptyAtByCurrent
    ? formatEta(prediction.asOf, prediction.eta.emptyAtByCurrent)
    : null;
  const historicalEta = prediction?.eta?.emptyAtByHistorical
    ? formatEta(prediction.asOf, prediction.eta.emptyAtByHistorical)
    : null;

  // Mock historical data - in real implementation, this would come from API
  const historicalData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
    consumed: Math.floor(Math.random() * 5),
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
          Zpět
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Sud #{barrel.orderNumber} - Detail
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 1, p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Status
            </Typography>
            <Typography variant="body1">
              Velikost: {barrel.size}L
            </Typography>
            <Typography variant="body1">
              Zbývá: {remaining} z {total} piv ({pctLabel})
            </Typography>
            <Typography variant="body1">
              Stav: {barrel.isActive ? 'Aktivní' : 'Neaktivní'}
            </Typography>
            {barrel.createdAt && (
              <Typography variant="body2" color="text.secondary">
                Vytvořeno: {format(new Date(barrel.createdAt), 'PPpp', { locale: cs })}
              </Typography>
            )}
          </Box>

          {prediction && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Predikce
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Bude prázdný za (aktuální tempo):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {currentEta
                      ? `${currentEta.relative} (${currentEta.absolute})`
                      : prediction.status === 'warming_up'
                        ? 'Sbírám data…'
                        : '—'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Bude prázdný za (historicky):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {historicalEta
                      ? `${historicalEta.relative} (${historicalEta.absolute})`
                      : '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ height: 300 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Spotřeba během dne
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="beerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="consumed"
                  stroke="#ff3b30"
                  fill="url(#beerGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
