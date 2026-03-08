import { Grid } from '@mui/material';
import { MetricCard } from '@demonicka/ui';
import {
  LocalBar as BeerIcon,
  Group as GroupIcon,
  Speed as SpeedIcon,
  Storage as BarrelIcon,
  TrendingDown as EfficiencyIcon,
} from '@mui/icons-material';
import { useTranslations } from '../../../../contexts/LocaleContext';

type Props = {
  totalBeers: number;
  totalLitres: number;
  participantsCount: number;
  avgPerPerson: number;
  avgPerHourValue: string;
  avgPerHourSubtitle?: string;
  activeBarrelsCount: number;
  efficiencyPercent: number;
};

export function DashboardKpis({
  totalBeers,
  totalLitres,
  participantsCount,
  avgPerPerson,
  avgPerHourValue,
  avgPerHourSubtitle,
  activeBarrelsCount,
  efficiencyPercent,
}: Props) {
  const t = useTranslations<Record<string, unknown>>('dashboard');
  const stats = t.stats as Record<string, string> | undefined;
  const kpis = t.kpis as Record<string, string> | undefined;
  const barrelStatus = t.barrelStatus as Record<string, string> | undefined;

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard 
          title={stats?.totalBeers ?? 'Celkem piv'} 
          value={totalBeers} 
          subtitle={`${totalLitres.toFixed(1)} L`}
          icon={<BeerIcon />} 
          to="/dashboard/kpi/total-beers" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title={kpis?.participants ?? 'Účastníci'} value={participantsCount} icon={<GroupIcon />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title={kpis?.avgPerPerson ?? 'průměr / os.'} value={avgPerPerson.toFixed(1)} icon={<GroupIcon />} to="/dashboard/kpi/avg-per-person" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title={kpis?.avgPerHour ?? 'Průměr / hod'}
          value={avgPerHourValue}
          subtitle={avgPerHourSubtitle}
          icon={<SpeedIcon />}
          to="/dashboard/kpi/avg-per-hour"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard title={barrelStatus?.activeBarrels ?? 'Aktivní sudy'} value={activeBarrelsCount} icon={<BarrelIcon />} to="/dashboard/barrels" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title={kpis?.efficiency ?? 'Efektivita'}
          value={`${efficiencyPercent.toFixed(1)}%`}
          icon={<EfficiencyIcon />}
        />
      </Grid>
    </Grid>
  );
}

