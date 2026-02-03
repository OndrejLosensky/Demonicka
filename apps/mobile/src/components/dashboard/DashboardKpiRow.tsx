import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  text: '#111',
  subtext: '#6b7280',
};

interface KpiItem {
  title: string;
  value: string | number;
  subtitle?: string;
}

interface Props {
  items: KpiItem[];
}

export function DashboardKpiRow({ items }: Props) {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <View
          key={i}
          style={[
            styles.card,
            (i % 2 === 0) ? styles.cardRightSpacing : undefined,
          ]}
        >
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  value: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  title: { fontSize: 12, color: COLORS.subtext, marginTop: 4 },
  subtitle: { fontSize: 11, color: COLORS.subtext, marginTop: 2 },
  cardRightSpacing: { marginRight: 12 },
});
