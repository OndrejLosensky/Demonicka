import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { DashboardStats } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';
import translations from '../../locales/cs/dashboard.json';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import { EventSelector } from '../../components/EventSelector';

const Dashboard: React.FC = () => {
  const { selectedEvent } = useSelectedEvent();
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
  const [stats, setStats] = useState<DashboardStats>({
    totalBeers: 0,
    totalUsers: 0,
    totalBarrels: 0,
    averageBeersPerUser: 0,
    topUsers: [],
    barrelStats: [],
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardService.getDashboardStats(selectedEvent?.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };

    loadStats();
  }, [selectedEvent?.id]);

  return (
    <div className="p-4">
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Typography variant="h4">
          {translations.overview.title}
        </Typography>
        {showEventHistory && <EventSelector />}
      </Box>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {translations.overview.cards.totalBeers}
            </Typography>
            <Typography variant="h5">{stats.totalBeers}</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {translations.overview.cards.totalUsers}
            </Typography>
            <Typography variant="h5">{stats.totalUsers}</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {translations.overview.cards.totalBarrels}
            </Typography>
            <Typography variant="h5">{stats.totalBarrels}</Typography>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              {translations.overview.charts.topUsers.title}
            </Typography>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">
                    {translations.overview.charts.topUsers.columns.name}
                  </th>
                  <th className="text-right p-2">
                    {translations.overview.charts.topUsers.columns.beers}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="text-left p-2">{user.name}</td>
                    <td className="text-right p-2">{user.beerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              {translations.overview.charts.barrelStats.title}
            </Typography>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">
                    {translations.overview.charts.barrelStats.columns.size}
                  </th>
                  <th className="text-right p-2">
                    {translations.overview.charts.barrelStats.columns.count}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.barrelStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="text-left p-2">{stat.size}l</td>
                    <td className="text-right p-2">{stat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 