import { useParams } from 'react-router-dom';
import { TotalBeersDetail } from './TotalBeersDetail';
import { AvgPerHourDetail } from './AvgPerHourDetail';
import { AvgPerPersonDetail } from './AvgPerPersonDetail';
import { KpiList } from './KpiList';

export { KpiList } from './KpiList';

export function KpiDetail() {
  const { metric } = useParams<{ metric: string }>();

  switch (metric) {
    case 'total-beers':
      return <TotalBeersDetail />;
    case 'avg-per-hour':
      return <AvgPerHourDetail />;
    case 'avg-per-person':
      return <AvgPerPersonDetail />;
    default:
      return <div>Unknown metric: {metric}</div>;
  }
}
