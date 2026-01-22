import { Box, Typography } from '@demonicka/ui';
import { Card } from '@mui/material';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HourlyStats } from '../../../../types/hourlyStats';
import { useAppTheme } from '../../../../contexts/ThemeContext';

type Props = {
  title?: string;
  date?: Date;
  hourly: HourlyStats[];
};

export function DashboardConsumptionChart({ title = 'Spotřeba piv během dne', date, hourly }: Props) {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const labelDate = date ?? new Date();
  const data = hourly.map((h) => ({
    hour: h.hour,
    label: `${h.hour.toString().padStart(2, '0')}:00`,
    count: h.count,
    // Fake timestamp for tooltip formatting; keeps it stable and localized.
    ts: new Date(
      labelDate.getFullYear(),
      labelDate.getMonth(),
      labelDate.getDate(),
      h.hour,
      0,
      0,
      0,
    ).toISOString(),
  }));

  type TooltipEntry = { payload?: { ts?: string } };
  const labelFormatter = (_label: string | number, payload?: TooltipEntry[]) => {
    const ts = payload?.[0]?.payload?.ts;
    if (typeof ts === 'string') {
      return format(new Date(ts), 'PPpp', { locale: cs });
    }
    return _label;
  };

  const valueFormatter = (value: number | string) => [value, 'Piv'] as [number | string, string];

  return (
    <Card sx={{ borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Link 
              to="/dashboard/consumption" 
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 800,
                  color: 'text.primary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {title}
              </Typography>
              <ChevronRight sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
            </Link>
            <Typography variant="body2" color="text.secondary">
              {format(labelDate, 'PP', { locale: cs })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="beerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="label" minTickGap={10} />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={labelFormatter}
                formatter={valueFormatter}
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
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Card>
  );
}

