import type { RouteObject } from 'react-router-dom';
import type { Event, BeerPongEvent } from '@demonicka/shared-types';
import translations from '../locales/cs/common.header.json';
import { eventService } from '../services/eventService';
import { beerPongService } from '../services/beerPongService';

export type DashboardDynamicResolverKey = 'event' | 'beerPong';

export type DashboardChromeHandle = {
  /** Breadcrumb label for this route segment */
  crumb?: string | ((params: Record<string, string>) => string);
  /** Page title for this route segment. If omitted, parent title can be used. */
  title?: string | ((params: Record<string, string>) => string);
  /** Hide DashboardChrome for this route (still sets document title). */
  hideChrome?: boolean;
  /** Optional dynamic label resolver */
  dynamic?: DashboardDynamicResolverKey;
};

export const dashboardRouteMeta: RouteObject[] = [
  {
    path: 'u',
    children: [
      {
        path: ':userId/profile',
        handle: {
          crumb: translations.auth.profile,
          title: translations.auth.profile,
        } satisfies DashboardChromeHandle,
      },
      {
        path: ':username',
        handle: {
          crumb: (p) => p.username ?? 'Uživatel',
          title: (p) => p.username ?? 'Uživatel',
        } satisfies DashboardChromeHandle,
        children: [
          {
            path: 'settings',
            handle: {
              crumb: 'Nastavení',
              title: 'Nastavení',
            } satisfies DashboardChromeHandle,
          },
          {
            path: 'achievements',
            handle: {
              crumb: 'Úspěchy',
              title: 'Úspěchy',
            } satisfies DashboardChromeHandle,
          },
          {
            path: 'dashboard',
            handle: {
              crumb: 'Moje statistiky',
              title: 'Moje statistiky',
            } satisfies DashboardChromeHandle,
            children: [
              {
                path: 'events',
                handle: {
                  crumb: 'Události',
                  title: 'Události',
                } satisfies DashboardChromeHandle,
                children: [
                  {
                    path: ':id',
                    handle: {
                      crumb: (p) => p.id ?? 'Událost',
                      title: (p) => p.id ?? 'Událost',
                      dynamic: 'event',
                    } satisfies DashboardChromeHandle,
                    children: [
                      {
                        path: 'beer-pong',
                        handle: {
                          crumb: 'Beer Pong',
                          title: 'Beer Pong',
                        } satisfies DashboardChromeHandle,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'dashboard',
    handle: {
      crumb: translations.navigation.dashboard,
      title: translations.navigation.dashboard,
    } satisfies DashboardChromeHandle,
    children: [
      {
        path: 'events',
        handle: {
          crumb: translations.navigation.events,
          title: translations.navigation.events,
        } satisfies DashboardChromeHandle,
        children: [
          {
            path: ':id',
            handle: {
              crumb: (p) => p.id ?? 'Událost',
              title: (p) => p.id ?? 'Událost',
              dynamic: 'event',
            } satisfies DashboardChromeHandle,
            children: [
              {
                path: 'results',
                handle: {
                  crumb: 'Výsledky',
                  title: 'Výsledky',
                } satisfies DashboardChromeHandle,
              },
              {
                path: 'registration',
                handle: {
                  crumb: 'Kontrola registrací',
                  title: 'Kontrola registrací',
                } satisfies DashboardChromeHandle,
              },
            ],
          },
        ],
      },
      {
        path: 'participants',
        handle: {
          crumb: translations.navigation.participants,
          title: translations.navigation.participants,
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'barrels',
        handle: {
          crumb: translations.navigation.barrels,
          title: translations.navigation.barrels,
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'consumption',
        handle: {
          crumb: 'Spotřeba piv',
          title: 'Spotřeba piv během dne',
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'kpi',
        handle: {
          crumb: 'KPI',
          title: 'KPI',
        } satisfies DashboardChromeHandle,
        children: [
          {
            path: ':metric',
            handle: {
              crumb: (p) => {
                const metricMap: Record<string, string> = {
                  'total-beers': 'Celkem piv',
                  'avg-per-hour': 'Průměr / hod',
                  'avg-per-person': 'průměr / os.',
                };
                return metricMap[p.metric ?? ''] ?? 'KPI';
              },
              title: (p) => {
                const metricMap: Record<string, string> = {
                  'total-beers': 'Celkem piv',
                  'avg-per-hour': 'Průměr / hod',
                  'avg-per-person': 'průměr / os.',
                };
                return metricMap[p.metric ?? ''] ?? 'KPI';
              },
            } satisfies DashboardChromeHandle,
          },
        ],
      },
      {
        path: 'barrel',
        handle: {
          crumb: 'Sud',
          title: 'Sud',
        } satisfies DashboardChromeHandle,
        children: [
          {
            path: ':id',
            handle: {
              crumb: (p) => `Sud #${p.id ?? ''}`,
              title: (p) => `Sud #${p.id ?? ''}`,
            } satisfies DashboardChromeHandle,
          },
        ],
      },
      {
        path: 'top-users',
        handle: {
          crumb: 'Nejlepší uživatelé',
          title: 'Nejlepší uživatelé',
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'activity',
        handle: {
          crumb: 'Aktivita',
          title: 'Aktivita',
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'beer-pong',
        handle: {
          crumb: 'Beer Pong',
          title: 'Beer Pong',
        } satisfies DashboardChromeHandle,
        children: [
          {
            path: ':id',
            handle: {
              crumb: (p) => p.id ?? 'Turnaj',
              title: (p) => p.id ?? 'Turnaj',
              dynamic: 'beerPong',
            } satisfies DashboardChromeHandle,
          },
        ],
      },
      {
        path: 'system',
        handle: {
          crumb: 'Systém',
          title: 'Systém',
        } satisfies DashboardChromeHandle,
        children: [
          { path: 'users', handle: { crumb: 'Uživatelé' } satisfies DashboardChromeHandle },
          { path: 'statistics', handle: { crumb: 'Statistiky' } satisfies DashboardChromeHandle },
          { path: 'operations', handle: { crumb: 'Operace' } satisfies DashboardChromeHandle },
          { path: 'settings', handle: { crumb: 'Nastavení' } satisfies DashboardChromeHandle },
        ],
      },
      {
        path: 'docs',
        handle: {
          crumb: 'Dokumentace',
          title: 'Dokumentace',
        } satisfies DashboardChromeHandle,
      },
    ],
  },
  {
    path: 'dashboard/leaderboard',
    handle: {
      crumb: translations.navigation.leaderboard,
      title: translations.navigation.leaderboard,
      hideChrome: true,
    } satisfies DashboardChromeHandle,
  },
  {
    path: ':userId/dashboard',
    handle: {
      crumb: 'Moje statistiky',
      title: 'Moje statistiky',
    } satisfies DashboardChromeHandle,
  },
];

export async function resolveDashboardDynamicLabel(
  key: DashboardDynamicResolverKey,
  id: string,
): Promise<string> {
  if (!id) return '';
  switch (key) {
    case 'event': {
      const e = (await eventService.getEvent(id)) as Event;
      return e?.name ?? id;
    }
    case 'beerPong': {
      const t = (await beerPongService.getById(id)) as BeerPongEvent;
      return t?.name ?? id;
    }
    default:
      return id;
  }
}

