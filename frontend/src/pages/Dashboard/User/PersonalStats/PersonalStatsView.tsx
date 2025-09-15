import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { Card } from '../../../../components/ui/Card';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { MetricCard } from '../../../../components/ui/MetricCard';
import { personalStatsService } from '../../../../services/personalStatsService';
import { usePageTitle } from '../../../../hooks/usePageTitle';

interface PersonalStats {
  totalBeers: number;
  eventStats: {
    eventId: string;
    eventName: string;
    userBeers: number;
    totalEventBeers: number;
    contribution: number;
    hourlyStats: {
      hour: number;
      count: number;
    }[];
    dailyStats: {
      date: string;
      count: number;
    }[];
  }[];
  // Optional properties that might not be available from the API
  achievements?: {
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
  }[];
  leaderboardPosition?: {
    overall: number;
    gender: number;
    event: number;
  };
  favoriteHour?: number;
  mostActiveDay?: string;
  averageBeersPerEvent?: number;
}

export const PersonalStatsView: React.FC = () => {
  usePageTitle('Osobní statistiky');
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [loading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await personalStatsService.getPersonalStats();
      
      // Add mock data for missing properties until backend provides them
      const dataWithExtras = data as unknown as PersonalStats;
      const enhancedData: PersonalStats = {
        ...dataWithExtras,
        leaderboardPosition: dataWithExtras.leaderboardPosition || {
          overall: 1,
          gender: 1,
          event: 1
        },
        achievements: dataWithExtras.achievements || [],
        favoriteHour: dataWithExtras.favoriteHour || 20,
        mostActiveDay: dataWithExtras.mostActiveDay || 'Pátek',
        averageBeersPerEvent: dataWithExtras.averageBeersPerEvent || (data.totalBeers / Math.max(data.eventStats?.length || 1, 1))
      };
      
      setStats(enhancedData);
    } catch (error) {
      console.error('Failed to load personal stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Osobní statistiky" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography>Načítání...</Typography>
        </Box>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box>
        <PageHeader title="Osobní statistiky" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography>Statistiky nebyly nalezeny.</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Osobní statistiky" />

      {/* Overview Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <MetricCard
          title="Celkem piv"
          value={stats?.totalBeers || 0}
          icon="🍺"
          color="primary"
        />
        <MetricCard
          title="Pozice celkem"
          value={`#${stats?.leaderboardPosition?.overall || 'N/A'}`}
          icon="🏆"
          color="warning"
        />
        <MetricCard
          title="Pozice v pohlaví"
          value={`#${stats?.leaderboardPosition?.gender || 'N/A'}`}
          icon="👥"
          color="info"
        />
        <MetricCard
          title="Průměr na událost"
          value={stats?.averageBeersPerEvent?.toFixed(1) || '0.0'}
          icon="📊"
          color="success"
        />
      </Box>

      {/* Event Breakdown */}
      <Box sx={{ mb: 4 }}>
        <Card>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Statistiky podle událostí
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {(stats?.eventStats || []).map((event) => (
            <Box key={event.eventId} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                {event.eventName}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Vaše piva: {event.userBeers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Celkem: {event.totalEventBeers}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Podíl:
                </Typography>
                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.200', borderRadius: 1 }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      bgcolor: 'primary.main', 
                      borderRadius: 1,
                      width: `${event.contribution}%`
                    }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {event.contribution.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          ))}
          </Box>
        </Card>
      </Box>

      {/* Achievements */}
      {(stats?.achievements || []).length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Card>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Odemčené úspěchy
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {(stats?.achievements || []).map((achievement) => (
              <Box key={achievement.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  🏅 {achievement.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {achievement.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Odemčeno: {new Date(achievement.unlockedAt).toLocaleDateString('cs-CZ')}
                </Typography>
              </Box>
              ))}
            </Box>
          </Card>
        </Box>
      )}

      {/* Fun Facts */}
      <Card>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Zajímavé statistiky
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {stats?.favoriteHour || 'N/A'}:00
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nejpilnější hodina
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {stats?.mostActiveDay || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nejpilnější den
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
