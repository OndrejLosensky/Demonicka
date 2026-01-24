import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, color = '#FF0000', style }: StatCardProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
