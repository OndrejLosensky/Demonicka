import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
  }[];
  leaderboardPosition: {
    overall: number;
    gender: number;
    event: number;
  };
  favoriteHour: number;
  mostActiveDay: string;
  averageBeersPerEvent: number;
}

export const PersonalStatsView: React.FC = () => {
  usePageTitle('Osobní statistiky');
  const { userId } = useParams<{ userId: string }>();
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [loading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const data = await personalStatsService.getPersonalStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load personal stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Osobní statistiky" />
        <Typography>Načítání...</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box>
        <PageHeader title="Osobní statistiky" />
        <Typography>Statistiky nebyly nalezeny.</Typography>
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
          value={stats.totalBeers}
          icon="🍺"
          color="primary"
        />
        <MetricCard
          title="Pozice celkem"
          value={`#${stats.leaderboardPosition.overall}`}
          icon="🏆"
          color="warning"
        />
        <MetricCard
          title="Pozice v pohlaví"
          value={`#${stats.leaderboardPosition.gender}`}
          icon="👥"
          color="info"
        />
        <MetricCard
          title="Průměr na událost"
          value={stats.averageBeersPerEvent.toFixed(1)}
          icon="📊"
          color="success"
        />
      </Box>

      {/* Event Breakdown */}
      <Card title="Statistiky podle událostí" sx={{ mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          {stats.eventStats.map((event) => (
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

      {/* Achievements */}
      {stats.achievements.length > 0 && (
        <Card title="Odemčené úspěchy" sx={{ mb: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            {stats.achievements.map((achievement) => (
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
      )}

      {/* Fun Facts */}
      <Card title="Zajímavé statistiky">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {stats.favoriteHour}:00
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nejpilnější hodina
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {stats.mostActiveDay}
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
