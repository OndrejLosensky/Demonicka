import { useRole } from '../../../../hooks/useRole';
import { EventDashboardScreen } from '../../../../components/screens/EventDashboardScreen';
import { PersonalOverviewScreen } from '../../../../components/screens/PersonalOverviewScreen';

export default function IndexScreen() {
  const { isOperator } = useRole();

  if (isOperator) {
    return <EventDashboardScreen />;
  }
  return <PersonalOverviewScreen />;
}
