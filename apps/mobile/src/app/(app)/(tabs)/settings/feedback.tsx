import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';

const MAX_LENGTH = 5000;

export default function FeedbackScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuthStore();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert('Chyba', 'Napište prosím zprávu.');
      return;
    }
    if (!token) {
      Alert.alert('Chyba', 'Nejste přihlášeni.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post<{ id: string }>(
        '/feedback',
        { message: trimmed, source: 'mobile' },
        token
      );
      Alert.alert('Děkujeme', 'Zpětná vazba byla odeslána.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setMessage('');
    } catch (e: unknown) {
      const err = e as { data?: { message?: string | string[] }; message?: string };
      const msg = Array.isArray(err?.data?.message)
        ? err.data.message[0]
        : err?.data?.message ?? err?.message ?? 'Odeslání se nezdařilo';
      Alert.alert('Chyba', String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Zpětná vazba</Text>
        <View style={styles.backBtn} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Slouží k hlášení chyb, návrhům na vylepšení nebo jakékoli jiné zpětné vazbě. Vaše zprávy ukládáme a průběžně je procházíme.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Napište svůj nápad, hlášení chyby nebo připomínku…"
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={MAX_LENGTH}
            editable={!isSubmitting}
            textAlignVertical="top"
          />
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {message.length}/{MAX_LENGTH}
          </Text>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting || !message.trim() ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Odeslat</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 140,
    fontSize: 16,
  },
  counter: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
