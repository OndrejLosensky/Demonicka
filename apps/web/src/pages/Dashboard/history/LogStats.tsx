import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useLogStats } from './useLogStats';
import { useTranslations } from '../../../contexts/LocaleContext';
import { withPageLoader } from '../../../components/hoc/withPageLoader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function LogStatsComponent() {
  const { stats, isLoading, error, dateRange, setDateRange } = useLogStats();
  const t = useTranslations<Record<string, unknown>>('dashboard.history');
  const statsT = (t.stats as Record<string, unknown>) || {};
  const dateRangeT = (statsT.dateRange as Record<string, string>) || {};
  const sections = (statsT.sections as Record<string, Record<string, unknown>>) || {};
  const eventsSection = (sections.events as Record<string, string>) || {};
  const logLevelsSection = (sections.logLevels as Record<string, unknown>) || {};
  const logLevelsTitle = typeof logLevelsSection.title === 'string' ? logLevelsSection.title : 'Úrovně logů';
  const logLevelsChartTitle = typeof logLevelsSection.chartTitle === 'string' ? logLevelsSection.chartTitle : 'Distribuce úrovní logů';
  const logLevelLabels = (typeof logLevelsSection.labels === 'object' && logLevelsSection.labels !== null ? logLevelsSection.labels : {}) as Record<string, string>;
  const participantsSection = (sections.participants as Record<string, string>) || {};

  if (isLoading) {
    return null; // withPageLoader will handle loading state
  }

  if (error) {
    return <div>{(statsT.error as string)?.replace('{{message}}', error.message) ?? `Chyba při načítání statistik: ${error.message}`}</div>;
  }

  if (!stats) {
    return null;
  }

  // Ensure eventCounts exists and has data
  const eventData = stats.eventCounts ? {
    labels: Object.keys(stats.eventCounts),
    datasets: [
      {
        label: eventsSection.label ?? 'Počet událostí',
        data: Object.values(stats.eventCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const logLevelData = {
    labels: [
      logLevelLabels.error ?? 'Chyba',
      logLevelLabels.warning ?? 'Varování',
      logLevelLabels.other ?? 'Ostatní'
    ],
    datasets: [
      {
        data: [
          stats.errorCount || 0,
          stats.warnCount || 0,
          (stats.totalLogs || 0) - (stats.errorCount || 0) - (stats.warnCount || 0),
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Ensure participantActivity exists and has data
  const participantData = stats.participantActivity ? {
    labels: Object.keys(stats.participantActivity),
    datasets: [
      {
        label: participantsSection.label ?? 'Aktivita účastníka',
        data: Object.values(stats.participantActivity),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">{(statsT.title as string) ?? 'Statistiky logů'}</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="date"
            value={dateRange.startDate.toISOString().split('T')[0]}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                startDate: new Date(e.target.value),
              }))
            }
            className="border rounded p-2"
            aria-label={dateRangeT.start ?? 'Počáteční datum'}
          />
          <input
            type="date"
            value={dateRange.endDate.toISOString().split('T')[0]}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                endDate: new Date(e.target.value),
              }))
            }
            className="border rounded p-2"
            aria-label={dateRangeT.end ?? 'Koncové datum'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{eventsSection.title ?? 'Distribuce událostí'}</h3>
            <Bar
              data={eventData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: eventsSection.chartTitle ?? 'Typy událostí',
                  },
                },
              }}
            />
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{logLevelsTitle}</h3>
          <Pie
            data={logLevelData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: logLevelsChartTitle,
                },
              },
            }}
          />
        </div>

        {participantData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{participantsSection.title ?? 'Aktivita účastníků'}</h3>
            <Bar
              data={participantData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: participantsSection.chartTitle ?? 'Aktivita podle účastníka',
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default withPageLoader(LogStatsComponent); 