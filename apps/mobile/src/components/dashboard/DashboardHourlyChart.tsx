import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../hooks/useThemeColors';

const CHART_HEIGHT = 200;

type HourlyPoint = { hour: number; count: number };

interface Props {
  hourly: HourlyPoint[];
  dateLabel?: string;
}

function normalize24Hours(points: HourlyPoint[]): HourlyPoint[] {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const p of points) {
    if (p.hour >= 0 && p.hour < 24) hours[p.hour].count = p.count;
  }
  return hours;
}

export function DashboardHourlyChart({ hourly, dateLabel }: Props) {
  const colors = useThemeColors();
  const data = normalize24Hours(hourly);
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const width = Dimensions.get('window').width - 48;
  const barWidth = Math.max(4, (width - 25 * 2) / 24 - 2);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Spotřeba piv během dne</Text>
        {dateLabel && <Text style={[styles.date, { color: colors.textMuted }]}>{dateLabel}</Text>}
      </View>
      <View style={styles.chart}>
        <Svg width={width} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.15" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          {data.map((d, i) => {
            const h = maxCount > 0 ? (d.count / maxCount) * (CHART_HEIGHT - 20) : 0;
            const x = 12 + i * (barWidth + 2);
            const y = CHART_HEIGHT - 10 - h;
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={h}
                fill="url(#barGrad)"
                rx={2}
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 2 },
  chart: { alignItems: 'center' },
});
