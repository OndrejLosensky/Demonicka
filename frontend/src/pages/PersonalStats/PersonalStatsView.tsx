import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../hooks/useToast';
import { personalStatsService } from '../../services/personalStatsService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';

interface PersonalStats {
  userId: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  totalBeers: number;
  averageBeersPerDay: number;
  averageBeersPerEvent: number;
  beersLastHour: number;
  beersToday: number;
  beersThisWeek: number;
  beersThisMonth: number;
  firstBeerDate: string | null;
  lastBeerDate: string | null;
  longestBreak: number;
  mostBeersInDay: number;
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];
  dailyStats: {
    date: string;
    count: number;
  }[];
  eventStats: {
    eventId: string;
    eventName: string;
    beersCount: number;
    rank: number;
    totalParticipants: number;
  }[];
  globalRank: number;
  totalUsers: number;
  percentile: number;
}

export const PersonalStatsView: React.FC = () => {
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllStats, setShowAllStats] = useState(false);
  const toast = useToast();
  const { activeEvent } = useActiveEvent();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await personalStatsService.getPersonalStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load personal stats:', error);
      setError('Failed to load personal statistics');
      toast.error('Failed to load personal statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredStats = () => {
    if (!stats || !activeEvent) return stats;

    if (!showAllStats) {
      // Filter stats for active event
      const activeEventStats = stats.eventStats.find(e => e.eventId === activeEvent.id);
      if (!activeEventStats) return stats;

      return {
        ...stats,
        totalBeers: activeEventStats.beersCount,
        globalRank: activeEventStats.rank,
        totalUsers: activeEventStats.totalParticipants,
        percentile: activeEventStats.rank / activeEventStats.totalParticipants,
        eventStats: [activeEventStats]
      };
    }

    return stats;
  };

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

  const filteredStats = getFilteredStats();
  if (!filteredStats) return null;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Můj přehled</h1>
        {activeEvent && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {showAllStats ? 'Všechny události' : activeEvent.name}
            </span>
            <button
              onClick={() => setShowAllStats(!showAllStats)}
              className={`px-4 py-2 rounded-full transition-colors ${
                showAllStats 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showAllStats ? 'Zobrazit aktivní' : 'Zobrazit vše'}
            </button>
          </div>
        )}
      </div>
      
      {/* Overall Stats */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Celkové statistiky</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Celkem piv</p>
            <p className="text-2xl font-bold">{filteredStats.totalBeers}</p>
          </div>
          {showAllStats && (
            <>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Dnes</p>
                <p className="text-2xl font-bold">{filteredStats.beersToday}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Tento týden</p>
                <p className="text-2xl font-bold">{filteredStats.beersThisWeek}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Tento měsíc</p>
                <p className="text-2xl font-bold">{filteredStats.beersThisMonth}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Rankings */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Žebříček</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              {showAllStats ? 'Globální pozice' : 'Pozice v události'}
            </p>
            <p className="text-2xl font-bold">{filteredStats.globalRank}. / {filteredStats.totalUsers}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Percentil</p>
            <p className="text-2xl font-bold">{(filteredStats.percentile * 100).toFixed(1)}%</p>
          </div>
          {showAllStats && (
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Průměr na den</p>
              <p className="text-2xl font-bold">{filteredStats.averageBeersPerDay.toFixed(1)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Hourly Distribution */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Hodinový přehled</h2>
        <div className="h-64">
          <div className="relative h-48">
            {filteredStats.hourlyDistribution.map((stat) => {
              const maxCount = Math.max(...filteredStats.hourlyDistribution.map(s => s.count));
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
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
          </div>
        </div>
      </Card>

      {/* Event Stats - Only show in all stats view */}
      {showAllStats && filteredStats.eventStats.map((eventStat) => (
        <Card key={eventStat.eventId}>
          <h2 className="text-xl font-semibold mb-4">{eventStat.eventName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Počet piv</p>
              <p className="text-2xl font-bold">{eventStat.beersCount}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Pozice</p>
              <p className="text-2xl font-bold">{eventStat.rank}. / {eventStat.totalParticipants}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Percentil</p>
              <p className="text-2xl font-bold">
                {((eventStat.rank / eventStat.totalParticipants) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};