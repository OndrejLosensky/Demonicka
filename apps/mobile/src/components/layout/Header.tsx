import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
}

export function Header({ title, subtitle, showBack = false, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  left: {
    width: 60,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 60,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 24,
    color: '#111',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButton: {
    padding: 8,
    marginRight: -8,
  },
  actionText: {
    fontSize: 15,
    color: '#FF0000',
    fontWeight: '500',
  },
});
