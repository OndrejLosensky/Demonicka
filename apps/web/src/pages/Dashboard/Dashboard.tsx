import React, { useMemo } from 'react';
import { Box, PageLoader } from '@demonicka/ui';
import { Chip, Container, Grid } from '@mui/material';
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

    const headerLeft = useMemo(() => {
      if (!dash.activeEvent) return undefined;
      return (
        <Chip
          label={`Aktivní událost: ${dash.activeEvent.name}`}
          color="success"
          size="small"
          sx={{ fontWeight: 800 }}
        />
      );
    }, [dash.activeEvent]);

    useDashboardHeaderSlots({ left: headerLeft });

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
          avgPerHour={dash.kpis.avgPerHour}
          activeBarrelsCount={dash.kpis.activeBarrelsCount}
          efficiencyPercent={dash.kpis.efficiencyPercent}
        />

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={8}>
            <DashboardConsumptionChart hourly={dash.hourly} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              <ActiveBarrelSvg
                barrel={dash.activeBarrel}
                prediction={dash.dashboardStats.barrelPrediction}
              />
              <DashboardInsights
                eventStartedAtLabel={dash.kpis.eventStartedAtLabel}
                peakHourLabel={dash.insights.peakHourLabel}
                peakHourBeers={dash.insights.peakHourBeers}
                topDrinkerUsername={dash.insights.topDrinkerUsername}
              />
            </Box>
          </Grid>
        </Grid>

        <DashboardTopUsers users={dash.dashboardStats.topUsers} />
      </Box>
    );
}; 