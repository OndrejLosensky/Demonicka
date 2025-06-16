import React from 'react';
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
import translations from '../../../locales/cs/dashboard.history.json';
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

  if (isLoading) {
    return null; // withPageLoader will handle loading state
  }

  if (error) {
    return <div>{translations.stats.error.replace('{{message}}', error.message)}</div>;
  }

  if (!stats) {
    return null;
  }

  // Ensure eventCounts exists and has data
  const eventData = stats.eventCounts ? {
    labels: Object.keys(stats.eventCounts),
    datasets: [
      {
        label: translations.stats.sections.events.label,
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
      translations.stats.sections.logLevels.labels.error,
      translations.stats.sections.logLevels.labels.warning,
      translations.stats.sections.logLevels.labels.other
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
        label: translations.stats.sections.participants.label,
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
        <h2 className="text-2xl font-bold mb-4">{translations.stats.title}</h2>
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
            aria-label={translations.stats.dateRange.start}
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
            aria-label={translations.stats.dateRange.end}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{translations.stats.sections.events.title}</h3>
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
                    text: translations.stats.sections.events.chartTitle,
                  },
                },
              }}
            />
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{translations.stats.sections.logLevels.title}</h3>
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
                  text: translations.stats.sections.logLevels.chartTitle,
                },
              },
            }}
          />
        </div>

        {participantData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{translations.stats.sections.participants.title}</h3>
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
                    text: translations.stats.sections.participants.chartTitle,
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