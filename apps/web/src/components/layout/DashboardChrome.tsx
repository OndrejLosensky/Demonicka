import { useMemo } from 'react';
import { Link as RouterLink, matchRoutes, useLocation } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Box, Typography, PageHeader } from '@demonicka/ui';
import { Breadcrumbs, Link as MuiLink } from '@mui/material';
import { dashboardRouteMeta, resolveDashboardDynamicLabel, type DashboardChromeHandle } from '../../routes/dashboardRouteMeta';
import translations from '../../locales/cs/common.header.json';
import { useDashboardChromeState } from '../../contexts/DashboardChromeContext';
import { usePageTitle } from '../../hooks/usePageTitle';

type Crumb = { label: string; to?: string };

export function DashboardChrome() {
  const location = useLocation();
  const { left, action } = useDashboardChromeState();

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
      items.push({ label: translations.navigation.dashboard, to: '/dashboard' });
    }

    for (const m of matches) {
      const handle = m.route.handle as DashboardChromeHandle | undefined;
      const pathnameBase = (m as any).pathnameBase as string | undefined;
      if (!handle?.crumb) continue;

      const params = m.params as Record<string, string>;
      let label =
        typeof handle.crumb === 'function' ? handle.crumb(params) : handle.crumb;

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
      const base =
        handle?.title
          ? typeof handle.title === 'function'
            ? handle.title(params)
            : handle.title
          : handle?.crumb
            ? typeof handle.crumb === 'function'
              ? handle.crumb(params)
              : handle.crumb
            : undefined;

      if (base) chosen = base;

      const pathnameBase = (m as any).pathnameBase as string | undefined;
      if (pathnameBase && dynamicLabelByPath.has(pathnameBase)) {
        const dynamic = dynamicLabelByPath.get(pathnameBase)!;
        if (dynamic.label) chosen = dynamic.label;
      }
    }

    return chosen || translations.navigation.dashboard;
  }, [matches, dynamicLabelByPath]);

  usePageTitle(title);

  if (hideChrome) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      {crumbs.length > 1 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
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

      <PageHeader title={title} left={left} action={action} />
    </Box>
  );
}

