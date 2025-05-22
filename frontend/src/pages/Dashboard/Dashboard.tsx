import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { CircularProgress, Paper, Grid, Typography, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { DashboardData } from '../../types/dashboard';

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
        <Typography color="error">Failed to load dashboard data.</Typography>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Typography>No data available.</Typography>
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
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Beers
              </Typography>
              <Typography variant="h5">{stats.totalBeers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Participants
              </Typography>
              <Typography variant="h5">{stats.totalParticipants || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Barrels
              </Typography>
              <Typography variant="h5">{stats.totalBarrels || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Beers per Participant
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
              Top Participants
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-right p-2">Beers</th>
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
              Barrel Distribution
            </Typography>
            <BarChart
              width={500}
              height={300}
              data={stats.barrelStats || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" label={{ value: 'Size (L)', position: 'bottom' }} />
              <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Number of Barrels" />
            </BarChart>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
} 