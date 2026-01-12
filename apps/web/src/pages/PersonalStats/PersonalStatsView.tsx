import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { MetricCard } from '../../components/ui/MetricCard';
import { personalStatsService } from '../../services/personalStatsService';
import { usePageTitle } from '../../hooks/usePageTitle';

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
    averagePerHour: number;
  }[];
}

export const PersonalStatsView: React.FC = () => {
  usePageTitle('Moje statistiky');
  const { userId } = useParams<{ userId: string }>();
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    console.log('loadStats called, userId:', userId);
    try {
      setIsLoading(true);
      setError(null);
      console.log('Making API call to /dashboard/personal');
      const data = await personalStatsService.getPersonalStats();
      console.log('API response:', data);
      setStats(data);
    } catch (error) {
      console.error('Failed to load personal stats:', error);
      setError('Failed to load personal statistics');
      // Don't call toast.error here to avoid infinite loops
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove isLoading dependency to prevent infinite loops

  useEffect(() => {
    console.log('useEffect triggered, userId:', userId);
    if (userId) {
      console.log('Calling loadStats with userId:', userId);
      loadStats();
    } else {
      console.log('No userId, not calling loadStats');
    }
  }, [userId, loadStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => loadStats()} 
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-600 p-4">
        No statistics available
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <PageHeader title="Moje statistiky" />

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard title="Celkem piv" value={stats.totalBeers} />
        <MetricCard title="Počet událostí" value={stats.eventStats.length} color="success" />
      </div>

      {/* Event Stats */}
      {stats.eventStats.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Statistiky událostí</h2>
          <div className="space-y-4">
            {stats.eventStats.map((event) => (
              <div key={event.eventId} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">{event.eventName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Moje piva</p>
                    <p className="text-xl font-bold">{event.userBeers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Celkem v události</p>
                    <p className="text-xl font-bold">{event.totalEventBeers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Příspěvek</p>
                    <p className="text-xl font-bold">{event.contribution.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Průměr/hodinu</p>
                    <p className="text-xl font-bold">{event.averagePerHour.toFixed(1)}</p>
                  </div>
                </div>
                
                {/* Hourly Stats */}
                {event.hourlyStats.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Hodinový přehled</h4>
                    <div className="h-32 relative">
                      {event.hourlyStats.map((stat) => {
                        const maxCount = Math.max(...event.hourlyStats.map(s => s.count));
                        const height = maxCount > 0 ? `${(stat.count / maxCount) * 100}%` : '0%';
                        return (
                          <div
                            key={stat.hour}
                            className="absolute bottom-0 bg-blue-500 rounded-t"
                            style={{
                              left: `${(stat.hour / 24) * 100}%`,
                              width: '4%',
                              height: height,
                            }}
                          >
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs">
                              {stat.count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>0h</span>
                      <span>6h</span>
                      <span>12h</span>
                      <span>18h</span>
                      <span>24h</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {stats.eventStats.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Zatím nemáte žádné statistiky z událostí.</p>
          </div>
        </Card>
      )}
    </div>
  );
};