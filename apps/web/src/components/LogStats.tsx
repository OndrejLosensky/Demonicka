import React, { useEffect, useState } from 'react';
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
import type { LogStats } from '../pages/Dashboard/history/types';
import { historyApi } from '../pages/Dashboard/history/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const LogStatsComponent: React.FC = () => {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await historyApi.getStats(dateRange.startDate, dateRange.endDate);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch log stats:', error);
      }
    };

    fetchStats();
  }, [dateRange]);

  if (!stats) {
    return <div>Loading statistics...</div>;
  }

  const eventData = {
    labels: Object.keys(stats.eventCounts),
    datasets: [
      {
        label: 'Event Counts',
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
  };

  const logLevelData = {
    labels: ['Error', 'Warning', 'Other'],
    datasets: [
      {
        data: [
          stats.errorCount,
          stats.warnCount,
          stats.totalLogs - stats.errorCount - stats.warnCount,
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

  const participantData = {
    labels: Object.keys(stats.participantActivity),
    datasets: [
      {
        label: 'Participant Activity',
        data: Object.values(stats.participantActivity),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">Log Statistics</h2>
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
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Event Distribution</h3>
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
                  text: 'Event Types',
                },
              },
            }}
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Log Levels</h3>
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
                  text: 'Log Level Distribution',
                },
              },
            }}
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Participant Activity</h3>
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
                  text: 'Activity by Participant',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}; 