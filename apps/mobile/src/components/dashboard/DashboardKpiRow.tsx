import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface KpiItem {
  title: string;
  value: string | number;
  subtitle?: string;
}

interface Props {
  items: KpiItem[];
}

export function DashboardKpiRow({ items }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            (i % 2 === 0) ? styles.cardRightSpacing : undefined,
          ]}
        >
          <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
          <Text style={[styles.title, { color: colors.textMuted }]}>{item.title}</Text>
          {item.subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: 1,
    marginBottom: 12,
  },
  value: { fontSize: 20, fontWeight: '700' },
  title: { fontSize: 12, marginTop: 4 },
  subtitle: { fontSize: 11, marginTop: 2 },
  cardRightSpacing: { marginRight: 12 },
});
