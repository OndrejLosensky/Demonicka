import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, ClipPath, G, Text as SvgText } from 'react-native-svg';

const W = 240;
const H = 220;
const barrelX = 62;
const barrelY = 22;
const barrelW = 116;
const barrelH = 176;
const innerPad = 10;
const innerX = barrelX + innerPad;
const innerY = barrelY + innerPad;
const innerW = barrelW - innerPad * 2;
const innerH = barrelH - innerPad * 2;

type BarrelInfo = {
  id: string;
  orderNumber: number;
  size: number;
  totalLitres: number;
  remainingLitres: number;
};

type PredictionEta = { relative: string; absolute: string } | null;

interface Props {
  barrel?: BarrelInfo | null;
  currentEta?: PredictionEta;
  historicalEta?: PredictionEta;
  status?: string;
}

export function DashboardActiveBarrel({
  barrel,
  currentEta,
  historicalEta,
  status,
}: Props) {
  if (!barrel) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Aktivní sud</Text>
        <Text style={styles.empty}>Není aktivní žádný sud.</Text>
      </View>
    );
  }

  const total = Math.max(0, Number(barrel.totalLitres || 0));
  const remaining = Math.max(0, Number(barrel.remainingLitres || 0));
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const fillH = innerH * pct;
  const fillY = innerY + (innerH - fillH);
  const pctLabel = total > 0 ? `${Math.round(pct * 100)}%` : '—';

  const currentLabel = currentEta
    ? `${currentEta.relative} (${currentEta.absolute})`
    : status === 'warming_up'
      ? 'Sbírám data…'
      : '—';
  const historicalLabel = historicalEta
    ? `${historicalEta.relative} (${historicalEta.absolute})`
    : '—';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Aktivní sud</Text>
        <Text style={styles.pct}>{pctLabel}</Text>
      </View>
      <Text style={styles.subtitle}>Sud #{barrel.orderNumber} · {barrel.size}L</Text>

      <View style={styles.svgWrap}>
        <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={240}>
          <Defs>
            <LinearGradient id="beerFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
              <Stop offset="55%" stopColor="#f59e0b" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
            </LinearGradient>
            <LinearGradient id="barrelShine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#fff" stopOpacity="0.06" />
              <Stop offset="35%" stopColor="#fff" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#000" stopOpacity="0.08" />
            </LinearGradient>
            <ClipPath id="innerClip">
              <Rect x={innerX} y={innerY} width={innerW} height={innerH} rx={18} />
            </ClipPath>
          </Defs>

          <Rect x={barrelX} y={barrelY} width={barrelW} height={barrelH} rx={26} fill="#111" opacity={0.08} />
          <Rect x={barrelX} y={barrelY} width={barrelW} height={barrelH} rx={26} fill="url(#barrelShine)" />
          <Rect x={innerX} y={innerY} width={innerW} height={innerH} rx={18} fill="#111" opacity={0.06} />

          <G clipPath="url(#innerClip)">
            <Rect
              x={innerX}
              y={fillY}
              width={innerW}
              height={fillH}
              fill="url(#beerFill)"
            />
            <Rect
              x={innerX}
              y={Math.max(innerY, fillY - 6)}
              width={innerW}
              height={8}
              fill="#fff"
              opacity={pct > 0 ? 0.25 : 0}
            />
          </G>

          {[52, 110, 168].map((y) => (
            <Rect
              key={y}
              x={barrelX + 6}
              y={y}
              width={barrelW - 12}
              height={10}
              rx={5}
              fill="#111"
              opacity={0.12}
            />
          ))}

          <SvgText x={W / 2} y={98} textAnchor="middle" fill="#111" fontSize={34} fontWeight="800">
            {remaining.toFixed(1)}
          </SvgText>
          <SvgText x={W / 2} y={124} textAnchor="middle" fill="#6b7280" fontSize={14} fontWeight="600">
            z {total.toFixed(1)} L
          </SvgText>
        </Svg>
      </View>

      <View style={styles.eta}>
        <View style={styles.etaRow}>
          <Text style={styles.etaLabel}>Bude prázdný za:</Text>
          <Text style={styles.etaValue}>{currentLabel}</Text>
        </View>
        <View style={styles.etaRow}>
          <Text style={styles.etaLabel}>Bude prázdný za (historicky):</Text>
          <Text style={styles.etaValue}>{historicalLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  pct: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  empty: { fontSize: 14, color: '#6b7280' },
  svgWrap: { alignItems: 'center', marginVertical: 8 },
  eta: { marginTop: 12, gap: 8 },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  etaLabel: { fontSize: 13, color: '#6b7280', flex: 1 },
  etaValue: { fontSize: 13, fontWeight: '700', color: '#111' },
});
