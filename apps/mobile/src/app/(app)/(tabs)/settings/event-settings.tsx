import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useRole } from '../../../../hooks/useRole';
import { Header } from '../../../../components/layout/Header';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Icon } from '../../../../components/icons';
import { formatDate } from '../../../../utils/format';

export default function EventSettingsScreen() {
  const { activeEvent, isLoading } = useActiveEvent();
  const { isOperator } = useRole();

  if (!isOperator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Nastavení události" showBack />
        <EmptyState
          icon={<Icon name="lock" size={48} color="#9ca3af" />}
          title="Přístup odepřen"
          message="Nemáte oprávnění k této sekci."
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (!activeEvent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Nastavení události" showBack />
        <EmptyState
          icon={<Icon name="calendar" size={48} color="#9ca3af" />}
          title="Žádná aktivní událost"
          message="Momentálně není aktivní žádná událost."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Nastavení události" showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Základní informace</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Název</Text>
              <Text style={styles.fieldValue}>{activeEvent.name}</Text>
            </View>
            {activeEvent.description && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Popis</Text>
                <Text style={styles.fieldValue}>{activeEvent.description}</Text>
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Začátek</Text>
              <Text style={styles.fieldValue}>{formatDate(activeEvent.startDate)}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Konec</Text>
              <Text style={styles.fieldValue}>{formatDate(activeEvent.endDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stav</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Aktivní událost</Text>
                <Text style={styles.switchDescription}>Událost je právě aktivní a probíhá</Text>
              </View>
              <Switch
                value={activeEvent.isActive}
                disabled
                trackColor={{ false: '#e5e7eb', true: '#dcfce7' }}
                thumbColor={activeEvent.isActive ? '#16a34a' : '#9ca3af'}
              />
            </View>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Registrace otevřená</Text>
                <Text style={styles.switchDescription}>Noví účastníci se mohou registrovat</Text>
              </View>
              <Switch
                value={activeEvent.registrationEnabled ?? false}
                disabled
                trackColor={{ false: '#e5e7eb', true: '#dcfce7' }}
                thumbColor={activeEvent.registrationEnabled ? '#16a34a' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {activeEvent.registrationToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registrace</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Registrační kód</Text>
                <Text style={styles.fieldValueMono}>{activeEvent.registrationToken}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Pro úpravu nastavení použijte webovou aplikaci.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  field: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  fieldLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  fieldValue: { fontSize: 15, color: '#111', fontWeight: '500' },
  fieldValueMono: { fontSize: 15, color: '#111', fontWeight: '500', fontFamily: 'monospace' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  switchLabel: { fontSize: 15, color: '#111', fontWeight: '500' },
  switchDescription: { fontSize: 13, color: '#6b7280', marginTop: 2, maxWidth: 240 },
  infoNote: { padding: 16, paddingTop: 24 },
  infoNoteText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' },
});
