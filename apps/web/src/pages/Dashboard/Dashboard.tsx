import React, { useMemo, useState, useCallback } from 'react';
import { Box, LoadingButton, MetricCardSkeleton, ChartSkeleton, CardSkeleton } from '@demonicka/ui';
import { Container, Grid } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { EmptyEventState } from '../../components/EmptyEventState';
import { useDashboardHeaderSlots } from '../../contexts/DashboardChromeContext';
import { useAdminDashboard } from './dashboard/useAdminDashboard';
import { DashboardKpis } from './dashboard/components/DashboardKpis';
import { DashboardConsumptionChart } from './dashboard/components/DashboardConsumptionChart';
import { ActiveBarrelSvg } from './dashboard/components/ActiveBarrelSvg';
import { DashboardInsights } from './dashboard/components/DashboardInsights';
import { DashboardTopUsers } from './dashboard/components/DashboardTopUsers';

export const Dashboard: React.FC = () => {
    const dash = useAdminDashboard();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
      setIsRefreshing(true);
      try {
        await dash.refresh();
      } finally {
        setIsRefreshing(false);
      }
    }, [dash.refresh]);

    const headerAction = useMemo(
      () => (
        <LoadingButton
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          loading={isRefreshing}
          sx={{ borderRadius: 1 }}
        >
          Obnovit
        </LoadingButton>
      ),
      [isRefreshing, handleRefresh],
    );

    useDashboardHeaderSlots({ action: headerAction });

    if (!dash.activeEvent) {
      return (
        <Container>
          <EmptyEventState />
        </Container>
      );
    }

    if (dash.isLoading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={2.5}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={idx}>
                <MetricCardSkeleton />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} lg={8}>
              <ChartSkeleton height={300} />
            </Grid>
            <Grid item xs={12} lg={4}>
              <CardSkeleton height={300} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <CardSkeleton contentLines={4} />
            </Grid>
            <Grid item xs={12} lg={4}>
              <CardSkeleton contentLines={3} />
            </Grid>
          </Grid>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <DashboardKpis
          totalBeers={dash.kpis.totalBeers}
          participantsCount={dash.kpis.participantsCount}
          avgPerPerson={dash.kpis.avgPerPerson}
          avgPerHourValue={dash.kpis.avgPerHourValue}
          avgPerHourSubtitle={dash.kpis.avgPerHourSubtitle}
          activeBarrelsCount={dash.kpis.activeBarrelsCount}
          efficiencyPercent={dash.kpis.efficiencyPercent}
        />

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={8}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <DashboardConsumptionChart hourly={dash.hourly} />
            </Box>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ActiveBarrelSvg
                barrel={dash.activeBarrel}
                prediction={dash.dashboardStats.barrelPrediction}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <DashboardTopUsers users={dash.dashboardStats.topUsers} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <DashboardInsights
              eventStartedAtLabel={dash.kpis.eventStartedAtLabel}
              peakHourLabel={dash.insights.peakHourLabel}
              peakHourBeers={dash.insights.peakHourBeers}
              topDrinkerUsername={dash.insights.topDrinkerUsername}
            />
          </Grid>
        </Grid>
      </Box>
    );
}; 