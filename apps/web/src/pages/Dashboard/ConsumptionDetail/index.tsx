import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, PageLoader } from '@demonicka/ui';
import { Button, ButtonGroup, IconButton, Menu, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Download as DownloadIcon } from '@mui/icons-material';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '../../../services/dashboardService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { Container } from '@mui/material';

type ChartType = 'area' | 'line' | 'bar';

export function ConsumptionDetail() {
  const { activeEvent } = useActiveEvent();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [chartType, setChartType] = useState<ChartType>('area');
  const [compareMode, setCompareMode] = useState<'none' | 'yesterday' | 'lastWeek' | 'lastMonth'>('none');
  const [dateRangeAnchor, setDateRangeAnchor] = useState<null | HTMLElement>(null);

  const dateParam = format(selectedDate, 'yyyy-MM-dd');
  const compareDateParam = compareMode === 'yesterday' 
    ? format(subDays(selectedDate, 1), 'yyyy-MM-dd')
    : compareMode === 'lastWeek'
    ? format(startOfWeek(subDays(selectedDate, 7), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    : compareMode === 'lastMonth'
    ? format(startOfMonth(subDays(selectedDate, 30)), 'yyyy-MM-dd')
    : null;

  const { data: hourly, isLoading: isLoadingHourly } = useQuery({
    queryKey: ['consumption-detail', activeEvent?.id, dateParam],
    queryFn: () => dashboardService.getHourlyStats(activeEvent!.id, dateParam),
    enabled: Boolean(activeEvent),
  });

  const { data: compareHourly } = useQuery({
    queryKey: ['consumption-detail-compare', activeEvent?.id, compareDateParam],
    queryFn: () => dashboardService.getHourlyStats(activeEvent!.id, compareDateParam!),
    enabled: Boolean(activeEvent && compareDateParam),
  });

  const normalize24Hours = (data: typeof hourly) => {
    if (!data) return [];
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const existingHours = data.map((h) => h.hour);
    const missingHours = allHours.filter((hour) => !existingHours.includes(hour));
    return [
      ...data,
      ...missingHours.map((hour) => ({ hour, count: 0 })),
    ].sort((a, b) => a.hour - b.hour);
  };

  const chartData = normalize24Hours(hourly).map((h) => ({
    hour: h.hour,
    label: `${h.hour.toString().padStart(2, '0')}:00`,
    count: h.count,
    ts: new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h.hour,
      0,
      0,
      0,
    ).toISOString(),
  }));

  const compareChartData = compareHourly && compareMode !== 'none'
    ? normalize24Hours(compareHourly).map((h) => {
        const currentCount = chartData.find((c) => c.hour === h.hour)?.count || 0;
        return {
          hour: h.hour,
          label: `${h.hour.toString().padStart(2, '0')}:00`,
          count: currentCount,
          compareCount: h.count,
        };
      })
    : [];

  const handleExport = (format: 'csv' | 'json') => {
    const data = chartData.map((d) => ({
      hour: d.label,
      count: d.count,
      date: format(selectedDate, 'yyyy-MM-dd'),
    }));

    if (format === 'csv') {
      const headers = ['Hour', 'Count', 'Date'];
      const rows = data.map((d) => [d.hour, d.count, d.date]);
      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consumption-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consumption-${format(selectedDate, 'yyyy-MM-dd')}.json`;
      a.click();
    }
  };

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState />
      </Container>
    );
  }

  if (isLoadingHourly) {
    return <PageLoader message="Načítání dat..." />;
  }

  const renderChart = () => {
    const data = compareMode !== 'none' && compareChartData.length > 0 ? compareChartData : chartData;

    if (chartType === 'area') {
      return (
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="beerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.05} />
            </linearGradient>
            {compareMode !== 'none' && (
              <linearGradient id="compareGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#666" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#666" stopOpacity={0.05} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="label" minTickGap={10} />
          <YAxis allowDecimals={false} />
          <Tooltip
            labelFormatter={(label) => label}
            formatter={(value: number) => [value, 'Piv']}
            contentStyle={{
              backgroundColor: isDark ? '#11161c' : '#ffffff',
              border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
              borderRadius: '4px',
              color: isDark ? '#e6e8ee' : '#1a1a1a',
            }}
            labelStyle={{
              color: isDark ? '#b8bcc7' : '#5f6368',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ff3b30"
            fill="url(#beerGradient)"
            strokeWidth={2}
          />
          {compareMode !== 'none' && (
            <Area
              type="monotone"
              dataKey="compareCount"
              stroke="#666"
              fill="url(#compareGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="label" minTickGap={10} />
          <YAxis allowDecimals={false} />
          <Tooltip
            labelFormatter={(label) => label}
            formatter={(value: number) => [value, 'Piv']}
            contentStyle={{
              backgroundColor: isDark ? '#11161c' : '#ffffff',
              border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
              borderRadius: '4px',
              color: isDark ? '#e6e8ee' : '#1a1a1a',
            }}
            labelStyle={{
              color: isDark ? '#b8bcc7' : '#5f6368',
            }}
          />
          <Line type="monotone" dataKey="count" stroke="#ff3b30" strokeWidth={2} />
          {compareMode !== 'none' && (
            <Line type="monotone" dataKey="compareCount" stroke="#666" strokeWidth={2} strokeDasharray="5 5" />
          )}
        </LineChart>
      );
    }

    return (
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="label" minTickGap={10} />
        <YAxis allowDecimals={false} />
        <Tooltip
          labelFormatter={(label) => label}
          formatter={(value: number) => [value, 'Piv']}
        />
        <Bar dataKey="count" fill="#ff3b30" />
        {compareMode !== 'none' && <Bar dataKey="compareCount" fill="#666" opacity={0.6} />}
      </BarChart>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ borderRadius: 1, p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Spotřeba piv během dne
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <DatePicker
                label="Datum"
                value={selectedDate}
                onChange={(newValue) => newValue && setSelectedDate(newValue)}
                format="dd.MM.yyyy"
                slotProps={{ textField: { size: 'small' } }}
              />
              <IconButton onClick={(e) => setDateRangeAnchor(e.currentTarget)}>
                <DownloadIcon />
              </IconButton>
              <Menu
                anchorEl={dateRangeAnchor}
                open={Boolean(dateRangeAnchor)}
                onClose={() => setDateRangeAnchor(null)}
              >
                <MenuItem onClick={() => { handleExport('csv'); setDateRangeAnchor(null); }}>
                  Exportovat CSV
                </MenuItem>
                <MenuItem onClick={() => { handleExport('json'); setDateRangeAnchor(null); }}>
                  Exportovat JSON
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <ButtonGroup size="small">
              <Button
                variant={chartType === 'area' ? 'contained' : 'outlined'}
                onClick={() => setChartType('area')}
              >
                Plocha
              </Button>
              <Button
                variant={chartType === 'line' ? 'contained' : 'outlined'}
                onClick={() => setChartType('line')}
              >
                Čára
              </Button>
              <Button
                variant={chartType === 'bar' ? 'contained' : 'outlined'}
                onClick={() => setChartType('bar')}
              >
                Sloupce
              </Button>
            </ButtonGroup>

            <ButtonGroup size="small">
              <Button
                variant={compareMode === 'none' ? 'contained' : 'outlined'}
                onClick={() => setCompareMode('none')}
              >
                Bez porovnání
              </Button>
              <Button
                variant={compareMode === 'yesterday' ? 'contained' : 'outlined'}
                onClick={() => setCompareMode('yesterday')}
              >
                Vs. včera
              </Button>
              <Button
                variant={compareMode === 'lastWeek' ? 'contained' : 'outlined'}
                onClick={() => setCompareMode('lastWeek')}
              >
                Vs. minulý týden
              </Button>
            </ButtonGroup>
          </Box>

          <Box sx={{ height: 500, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
