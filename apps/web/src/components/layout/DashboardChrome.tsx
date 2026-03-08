import { useMemo } from 'react';
import { Link as RouterLink, matchRoutes, useLocation } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Box, Typography, PageHeader } from '@demonicka/ui';
import { Breadcrumbs, Link as MuiLink } from '@mui/material';
import { dashboardRouteMeta, resolveDashboardDynamicLabel, type DashboardChromeHandle } from '../../routes/dashboardRouteMeta';
import { useTranslations } from '../../contexts/LocaleContext';
import { useDashboardChromeState } from '../../contexts/DashboardChromeContext';
import { usePageTitle } from '../../hooks/usePageTitle';

type Crumb = { label: string; to?: string };

function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const v = path.split('.').reduce(
    (o: unknown, k: string) =>
      o && typeof o === 'object' && k in o ? (o as Record<string, unknown>)[k] : undefined,
    obj,
  );
  return typeof v === 'string' ? v : undefined;
}

export function DashboardChrome() {
  const location = useLocation();
  const { left, action } = useDashboardChromeState();
  const headerT = useTranslations<Record<string, unknown>>('common.header');

  const matches = useMemo(() => matchRoutes(dashboardRouteMeta, location) ?? [], [location]);

  const dynamicRequests = useMemo(
    () =>
      matches
        .map((m) => {
          const handle = m.route.handle as DashboardChromeHandle | undefined;
          const id = (m.params as Record<string, string | undefined>)?.id;
          if (!handle?.dynamic || !id) return null;
          return { key: handle.dynamic, id, pathnameBase: (m as any).pathnameBase as string };
        })
        .filter(Boolean) as { key: NonNullable<DashboardChromeHandle['dynamic']>; id: string; pathnameBase: string }[],
    [matches],
  );

  const dynamicResults = useQueries({
    queries: dynamicRequests.map((r) => ({
      queryKey: ['dashboardChromeLabel', r.key, r.id],
      queryFn: () => resolveDashboardDynamicLabel(r.key, r.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const dynamicLabelByPath = useMemo(() => {
    const map = new Map<string, { label?: string; isLoading: boolean }>();
    dynamicRequests.forEach((req, i) => {
      const res = dynamicResults[i];
      map.set(req.pathnameBase, {
        label: res.data,
        isLoading: res.isLoading,
      });
    });
    return map;
  }, [dynamicRequests, dynamicResults]);

  const hideChrome = useMemo(() => {
    const last = matches[matches.length - 1];
    const handle = last?.route.handle as DashboardChromeHandle | undefined;
    return Boolean(handle?.hideChrome);
  }, [matches]);

  const crumbs: Crumb[] = useMemo(() => {
    const items: Crumb[] = [];

    const isDashboardPath =
      matches[0]?.route.path === 'dashboard' || matches[0]?.route.path === 'u';
    if (!isDashboardPath) {
      items.push({
        label: getByPath(headerT, 'navigation.dashboard') ?? 'Dashboard',
        to: '/dashboard',
      });
    }

    for (const m of matches) {
      const handle = m.route.handle as DashboardChromeHandle | undefined;
      const pathnameBase = (m as any).pathnameBase as string | undefined;
      if (!handle?.crumb && !handle?.crumbKey) continue;

      const params = m.params as Record<string, string>;
      let label: string;
      if (handle.crumbKey) {
        label = getByPath(headerT, handle.crumbKey) ?? (typeof handle.crumb === 'string' ? handle.crumb : '');
      } else {
        label =
          typeof handle.crumb === 'function' ? handle.crumb(params) : (handle.crumb ?? '');
      }

      if (pathnameBase && dynamicLabelByPath.has(pathnameBase)) {
        const dynamic = dynamicLabelByPath.get(pathnameBase)!;
        if (dynamic.isLoading) label = '…';
        else if (dynamic.label) label = dynamic.label;
      }

      items.push({
        label,
        to: pathnameBase,
      });
    }

    // remove link on last crumb
    if (items.length) {
      items[items.length - 1] = { label: items[items.length - 1].label };
    }

    return items;
  }, [matches, dynamicLabelByPath]);

  const title = useMemo(() => {
    let chosen: string | undefined;

    for (const m of matches) {
      const handle = m.route.handle as DashboardChromeHandle | undefined;
      const params = m.params as Record<string, string>;
      let base: string | undefined;
      if (handle?.titleKey) {
        base = getByPath(headerT, handle.titleKey);
      } else if (handle?.title) {
        base = typeof handle.title === 'function' ? handle.title(params) : handle.title;
      } else if (handle?.crumbKey) {
        base = getByPath(headerT, handle.crumbKey);
      } else if (handle?.crumb) {
        base = typeof handle.crumb === 'function' ? handle.crumb(params) : handle.crumb;
      }
      if (base) chosen = base;

      const pathnameBase = (m as any).pathnameBase as string | undefined;
      if (pathnameBase && dynamicLabelByPath.has(pathnameBase)) {
        const dynamic = dynamicLabelByPath.get(pathnameBase)!;
        if (dynamic.label) chosen = dynamic.label;
      }
    }

    return chosen ?? getByPath(headerT, 'navigation.dashboard') ?? 'Dashboard';
  }, [matches, dynamicLabelByPath, headerT]);

  usePageTitle(title);

  if (hideChrome) return null;

  const isDashboardRoute = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ minHeight: crumbs.length > 0 ? '24px' : 0, mb: crumbs.length > 0 ? 1 : 0 }}>
        {crumbs.length > 0 && (
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem' }}>
            {crumbs.map((c, idx) =>
              c.to ? (
                <MuiLink
                  key={`${c.label}-${idx}`}
                  component={RouterLink}
                  to={c.to}
                  underline="hover"
                  color="inherit"
                  sx={{ fontSize: '0.85rem' }}
                >
                  {c.label}
                </MuiLink>
              ) : (
                <Typography key={`${c.label}-${idx}`} color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {c.label}
                </Typography>
              ),
            )}
          </Breadcrumbs>
        )}
      </Box>

      <PageHeader title={title} left={left} action={action} noMargin={isDashboardRoute} />
    </Box>
  );
}

