import React, { useMemo, useState, useCallback } from 'react';
import { Box, PageLoader } from '@demonicka/ui';
import { Container, Grid, Button, CircularProgress } from '@mui/material';
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
        <Button
          variant="outlined"
          startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={isRefreshing}
          sx={{ borderRadius: 1 }}
        >
          Obnovit
        </Button>
      ),
      [isRefreshing, handleRefresh],
    );

    useDashboardHeaderSlots({ action: headerAction });

    if (dash.isLoading) return <PageLoader message="Načítání přehledu..." />;

    if (!dash.activeEvent) {
      return (
        <Container>
          <EmptyEventState />
        </Container>
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