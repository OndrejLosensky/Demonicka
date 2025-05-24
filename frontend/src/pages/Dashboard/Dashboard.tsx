import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { CircularProgress, Paper, Grid, Typography, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { DashboardData } from '../../types/dashboard';
import translations from '../../locales/cs/dashboard.json';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getOverview,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Typography color="error">{translations.errors.loadFailed}</Typography>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Typography>{translations.errors.noData}</Typography>
      </div>
    );
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    return typeof num === 'number' ? num.toFixed(1) : '0';
  };

  return (
    <div className="p-6">
      <Typography variant="h4" gutterBottom>
        {translations.overview.title}
      </Typography>

      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {translations.overview.cards.totalBeers}
              </Typography>
              <Typography variant="h5">{stats.totalBeers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {translations.overview.cards.totalParticipants}
              </Typography>
              <Typography variant="h5">{stats.totalParticipants || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {translations.overview.cards.totalBarrels}
              </Typography>
              <Typography variant="h5">{stats.totalBarrels || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {translations.overview.cards.avgBeersPerParticipant}
              </Typography>
              <Typography variant="h5">
                {formatNumber(stats.averageBeersPerParticipant)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              {translations.overview.charts.topParticipants.title}
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">{translations.overview.charts.topParticipants.columns.name}</th>
                    <th className="text-right p-2">{translations.overview.charts.topParticipants.columns.beers}</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.topParticipants || []).map((participant) => (
                    <tr key={participant.id}>
                      <td className="p-2">{participant.name}</td>
                      <td className="text-right p-2">{participant.beerCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              {translations.overview.charts.barrelDistribution.title}
            </Typography>
            <BarChart
              width={500}
              height={300}
              data={stats.barrelStats || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="size" 
                label={{ 
                  value: translations.overview.charts.barrelDistribution.axis.size, 
                  position: 'bottom' 
                }} 
              />
              <YAxis 
                label={{ 
                  value: translations.overview.charts.barrelDistribution.axis.count, 
                  angle: -90, 
                  position: 'insideLeft' 
                }} 
              />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#8884d8" 
                name={translations.overview.charts.barrelDistribution.legend.barrels} 
              />
            </BarChart>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
} 