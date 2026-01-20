import { Grid } from '@mui/material';
import { MetricCard } from '@demonicka/ui';
import {
  LocalBar as BeerIcon,
  Group as GroupIcon,
  Speed as SpeedIcon,
  Storage as BarrelIcon,
  TrendingDown as EfficiencyIcon,
} from '@mui/icons-material';

type Props = {
  totalBeers: number;
  participantsCount: number;
  avgPerPerson: number;
  avgPerHour: number;
  activeBarrelsCount: number;
  efficiencyPercent: number;
};

export function DashboardKpis({
  totalBeers,
  participantsCount,
  avgPerPerson,
  avgPerHour,
  activeBarrelsCount,
  efficiencyPercent,
}: Props) {
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title="Celkem piv" value={totalBeers} icon={<BeerIcon />} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title="Účastníci" value={participantsCount} icon={<GroupIcon />} color="warning" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title="Průměr na osobu" value={avgPerPerson.toFixed(1)} icon={<GroupIcon />} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title="Průměr / hod" value={avgPerHour.toFixed(1)} icon={<SpeedIcon />} color="error" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title="Aktivní sudy" value={activeBarrelsCount} icon={<BarrelIcon />} color="info" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Efektivita"
          value={`${efficiencyPercent.toFixed(1)}%`}
          icon={<EfficiencyIcon />}
          color="warning"
        />
      </Grid>
    </Grid>
  );
}

