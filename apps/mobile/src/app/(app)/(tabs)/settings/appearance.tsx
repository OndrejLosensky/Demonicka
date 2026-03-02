import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../../../components/icons';
import { useTheme } from '../../../../hooks/useTheme';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import type { ThemePreference } from '../../../../store/theme.store';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Světlý' },
  { value: 'dark', label: 'Tmavý' },
  { value: 'system', label: 'Podle systému' },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const colors = useThemeColors();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Text style={[styles.backText, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Vzhled</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Preference
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.themeRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth:
                    opt.value !== THEME_OPTIONS[THEME_OPTIONS.length - 1].value
                      ? 1
                      : 0,
                },
              ]}
              onPress={() => setPreference(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                {opt.label}
              </Text>
              {preference === opt.value && (
                <View style={styles.checkWrap}>
                  <Icon name="check" size={20} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backText: { fontSize: 24, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 12, overflow: 'hidden' },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  themeLabel: { fontSize: 16 },
  checkWrap: { marginLeft: 8 },
});
