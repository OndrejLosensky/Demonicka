import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { Barrel, DashboardStats, Event } from '@demonicka/shared-types';
import type { HourlyStats } from '../../../types/hourlyStats';
import { eventService } from '../../../services/eventService';
import { barrelService } from '../../../services/barrelService';
import { dashboardService } from '../../../services/dashboardService';
import { websocketService } from '../../../services/websocketService';

export type AdminDashboardState = {
  isLoading: boolean;
  activeEvent: Event | null;
  dashboardStats: DashboardStats;
  barrels: Barrel[];
  activeBarrel?: Barrel;
  hourly: HourlyStats[];
  kpis: {
    totalBeers: number;
    participantsCount: number;
    avgPerPerson: number;
    avgPerHourValue: string;
    avgPerHourSubtitle?: string;
    activeBarrelsCount: number;
    remainingBeers: number;
    efficiencyPercent: number;
    eventStartedAtLabel: string;
  };
  insights: {
    peakHourLabel: string;
    peakHourBeers: number;
    topDrinkerUsername: string;
  };
  refresh: () => Promise<void>;
};

const emptyStats: DashboardStats = {
  totalBeers: 0,
  totalUsers: 0,
  totalBarrels: 0,
  averageBeersPerUser: 0,
  topUsers: [],
  barrelStats: [],
};

function normalize24Hours(points: HourlyStats[]): HourlyStats[] {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const p of points) {
    if (p.hour >= 0 && p.hour < 24) hours[p.hour].count = p.count;
  }
  return hours;
}

export function useAdminDashboard(): AdminDashboardState {
  const [isLoading, setIsLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(emptyStats);
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [hourly, setHourly] = useState<HourlyStats[]>(normalize24Hours([]));

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventData = await eventService.getActiveEvent();
      setActiveEvent(eventData);

      if (!eventData) {
        // Still refresh global barrels/stats so UI can render consistently.
        const [barrelsData, dashboardData] = await Promise.all([
          barrelService.getAll(),
          dashboardService.getDashboardStats(undefined),
        ]);
        setBarrels(barrelsData);
        setDashboardStats(dashboardData);
        setHourly(normalize24Hours([]));
        return;
      }

      const dateParam = new Date().toISOString().split('T')[0];
      const [barrelsData, dashboardData, hourlyData, leaderboard] = await Promise.all([
        barrelService.getAll(),
        dashboardService.getDashboardStats(eventData.id),
        dashboardService.getHourlyStats(eventData.id, dateParam),
        dashboardService.getLeaderboard(eventData.id),
      ]);

      setBarrels(barrelsData);
      setDashboardStats(dashboardData);
      setHourly(normalize24Hours(hourlyData));

      // Keep total beers consistent with leaderboard (participants-only correction).
      const totalFromLeaderboard =
        (leaderboard.males ?? []).reduce((s, u) => s + (u.beerCount || 0), 0) +
        (leaderboard.females ?? []).reduce((s, u) => s + (u.beerCount || 0), 0);

      if (Number.isFinite(totalFromLeaderboard)) {
        setDashboardStats((prev) => ({ ...prev, totalBeers: totalFromLeaderboard }));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const refreshHandler = () => void refresh();
    const statsUpdateHandler = (data: unknown) => {
      const payload = data as { dashboard?: DashboardStats; public?: { totalBeers?: number; totalUsers?: number } };
      if (payload.dashboard) setDashboardStats(payload.dashboard);
      if (payload.public) {
        setDashboardStats((prev) => ({
          ...prev,
          totalBeers: payload.public?.totalBeers ?? prev.totalBeers,
          totalUsers: payload.public?.totalUsers ?? prev.totalUsers,
        }));
      }
    };

    websocketService.subscribe('dashboard:update', refreshHandler);
    websocketService.subscribe('dashboard:stats:update', statsUpdateHandler);

    // Fallback refresh every 5 minutes in case WebSocket fails
    const interval = setInterval(() => {
      void refresh();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      websocketService.unsubscribe('dashboard:update', refreshHandler);
      websocketService.unsubscribe('dashboard:stats:update', statsUpdateHandler);
    };
  }, [refresh]);

  useEffect(() => {
    if (!activeEvent?.id) return;
    websocketService.joinEvent(activeEvent.id);
    return () => websocketService.leaveEvent(activeEvent.id);
  }, [activeEvent?.id]);

  const activeBarrel = useMemo(() => barrels.find((b) => b.isActive), [barrels]);

  const derived = useMemo(() => {
    const activeBarrelsCount = barrels.filter((b) => b.isActive).length;
    const remainingBeers = barrels.reduce((sum, b) => sum + (b.remainingBeers || 0), 0);
    const totalCapacity = barrels.reduce((sum, b) => sum + (b.totalBeers || 0), 0);
    const efficiencyPercent =
      totalCapacity > 0 ? ((totalCapacity - remainingBeers) / totalCapacity) * 100 : 0;

    const participantsCount = dashboardStats.totalUsers || 0;
    const totalBeers = dashboardStats.totalBeers || 0;
    const avgPerPerson = participantsCount > 0 ? totalBeers / participantsCount : 0;

    const avgEventPace = dashboardStats.eventPace?.avgBeersPerActiveHour ?? null;
    const currentPace = dashboardStats.eventPace?.currentBeersPerHour ?? null;
    const windowMinutes = dashboardStats.eventPace?.windowMinutes ?? 60;
    const avgPerHourValue =
      typeof avgEventPace === 'number' && Number.isFinite(avgEventPace)
        ? avgEventPace.toFixed(1)
        : '—';
    const avgPerHourSubtitle =
      typeof currentPace === 'number' && Number.isFinite(currentPace)
        ? `${currentPace.toFixed(1)}/h (posledních ${windowMinutes} min)`
        : undefined;

    const peak = hourly.reduce((max, cur) => (cur.count > max.count ? cur : max), {
      hour: 0,
      count: 0,
    });
    const peakHourLabel =
      peak.count > 0 ? `${peak.hour.toString().padStart(2, '0')}:00` : 'Žádná data';

    const topDrinkerUsername = dashboardStats.topUsers?.[0]?.username ?? 'Nikdo';

    return {
      kpis: {
        totalBeers,
        participantsCount,
        avgPerPerson,
        avgPerHourValue,
        avgPerHourSubtitle,
        activeBarrelsCount,
        remainingBeers,
        efficiencyPercent,
        eventStartedAtLabel: activeEvent
          ? format(new Date(activeEvent.startDate), 'PPp', { locale: cs })
          : '',
      },
      insights: {
        peakHourLabel,
        peakHourBeers: peak.count,
        topDrinkerUsername,
      },
    };
  }, [activeEvent, barrels, dashboardStats, hourly]);

  return {
    isLoading,
    activeEvent,
    dashboardStats,
    barrels,
    activeBarrel,
    hourly,
    kpis: derived.kpis,
    insights: derived.insights,
    refresh,
  };
}

