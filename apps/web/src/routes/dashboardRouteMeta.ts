import type { RouteObject } from 'react-router-dom';
import type { Event, BeerPongEvent } from '@demonicka/shared-types';
import { eventService } from '../services/eventService';
import { beerPongService } from '../services/beerPongService';

export type DashboardDynamicResolverKey = 'event' | 'beerPong';

export type DashboardChromeHandle = {
  /** Breadcrumb label for this route segment */
  crumb?: string | ((params: Record<string, string>) => string);
  /** Page title for this route segment. If omitted, parent title can be used. */
  title?: string | ((params: Record<string, string>) => string);
  /** Translation key path (e.g. 'navigation.dashboard') for crumb – resolved in DashboardChrome by locale */
  crumbKey?: string;
  /** Translation key path for title – resolved in DashboardChrome by locale */
  titleKey?: string;
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
          crumbKey: 'auth.profile',
          titleKey: 'auth.profile',
        } satisfies DashboardChromeHandle,
      },
      {
        path: ':username',
        handle: {
          crumb: (p) => p.username ?? 'User',
          title: (p) => p.username ?? 'User',
        } satisfies DashboardChromeHandle,
        children: [
          {
            path: 'settings',
            handle: {
              crumbKey: 'navigation.settings',
              titleKey: 'navigation.settings',
            } satisfies DashboardChromeHandle,
          },
          {
            path: 'achievements',
            handle: {
              crumbKey: 'navigation.achievements',
              titleKey: 'navigation.achievements',
            } satisfies DashboardChromeHandle,
          },
          {
            path: 'gallery',
            handle: {
              crumbKey: 'navigation.gallery',
              titleKey: 'navigation.gallery',
            } satisfies DashboardChromeHandle,
          },
          {
            path: 'dashboard',
            handle: {
              crumbKey: 'navigation.myStats',
              titleKey: 'navigation.myStats',
            } satisfies DashboardChromeHandle,
            children: [
              {
                path: 'events',
                handle: {
                  crumbKey: 'navigation.events',
                  titleKey: 'navigation.events',
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
                      {
                        path: 'gallery',
                        handle: {
                          crumbKey: 'navigation.gallery',
                          titleKey: 'navigation.gallery',
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
      crumbKey: 'navigation.dashboard',
      titleKey: 'navigation.dashboard',
    } satisfies DashboardChromeHandle,
    children: [
      {
        path: 'events',
        handle: {
          crumbKey: 'navigation.events',
          titleKey: 'navigation.events',
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
          crumbKey: 'navigation.participants',
          titleKey: 'navigation.participants',
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'barrels',
        handle: {
          crumbKey: 'navigation.barrels',
          titleKey: 'navigation.barrels',
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
          crumbKey: 'navigation.activity',
          titleKey: 'navigation.activity',
        } satisfies DashboardChromeHandle,
      },
      {
        path: 'feedback',
        handle: {
          crumbKey: 'auth.feedback',
          titleKey: 'auth.feedback',
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
          crumbKey: 'navigation.system',
          titleKey: 'navigation.system',
        } satisfies DashboardChromeHandle,
        children: [
          { path: 'users', handle: { crumb: 'Uživatelé' } satisfies DashboardChromeHandle },
          { path: 'statistics', handle: { crumb: 'Statistiky' } satisfies DashboardChromeHandle },
          { path: 'operations', handle: { crumb: 'Operace' } satisfies DashboardChromeHandle },
          { path: 'settings', handle: { crumbKey: 'navigation.settings', titleKey: 'navigation.settings' } satisfies DashboardChromeHandle },
        ],
      },
      {
        path: 'docs',
        handle: {
          crumbKey: 'navigation.docs',
          titleKey: 'navigation.docs',
        } satisfies DashboardChromeHandle,
      },
    ],
  },
  {
    path: 'dashboard/leaderboard',
    handle: {
      crumbKey: 'navigation.leaderboard',
      titleKey: 'navigation.leaderboard',
      hideChrome: true,
    } satisfies DashboardChromeHandle,
  },
  {
    path: ':userId/dashboard',
    handle: {
      crumbKey: 'navigation.myStats',
      titleKey: 'navigation.myStats',
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

