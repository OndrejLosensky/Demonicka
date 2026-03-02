import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ label, value, icon, color = '#FF0000', style }: StatCardProps) {
  const colors = useThemeColors();
  const valueColor = color ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, style]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  iconWrap: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
