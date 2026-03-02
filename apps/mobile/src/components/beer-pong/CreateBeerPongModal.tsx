import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { CreateBeerPongEventDto } from '@demonicka/shared-types';
import { CancellationPolicy } from '@demonicka/shared-types';

interface CreateBeerPongModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBeerPongEventDto) => Promise<void>;
}

const DEFAULT_BEERS = 2;
const DEFAULT_TIME_WINDOW = 5;
const DEFAULT_UNDO_WINDOW = 5;

export function CreateBeerPongModal({
  visible,
  onClose,
  onSubmit,
}: CreateBeerPongModalProps) {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [overrideDefaults, setOverrideDefaults] = useState(false);
  const [beersPerPlayer, setBeersPerPlayer] = useState(DEFAULT_BEERS);
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(DEFAULT_TIME_WINDOW);
  const [undoWindowMinutes, setUndoWindowMinutes] = useState(DEFAULT_UNDO_WINDOW);
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(
    CancellationPolicy.KEEP_BEERS
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setOverrideDefaults(false);
      setBeersPerPlayer(DEFAULT_BEERS);
      setTimeWindowMinutes(DEFAULT_TIME_WINDOW);
      setUndoWindowMinutes(DEFAULT_UNDO_WINDOW);
      setCancellationPolicy(CancellationPolicy.KEEP_BEERS);
      setError('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Zadejte název turnaje');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const base: CreateBeerPongEventDto = {
        eventId: '',
        name: trimmed,
        description: description.trim() || undefined,
      };
      const data = overrideDefaults
        ? {
            ...base,
            beersPerPlayer,
            timeWindowMinutes,
            undoWindowMinutes,
            cancellationPolicy,
          }
        : base;
      await onSubmit(data);
      onClose();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Nepodařilo se vytvořit turnaj';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 24,
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: 16,
          maxHeight: '85%',
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 8,
        },
        scroll: { maxHeight: 400 },
        scrollContent: { padding: 20, paddingBottom: 16 },
        label: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 6,
          marginTop: 12,
        },
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 8,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: colors.border,
          marginRight: 10,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
        checkboxLabel: { fontSize: 15, color: colors.textSecondary, flex: 1 },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.inputBg,
        },
        inputError: { borderColor: colors.red },
        inputMultiline: { minHeight: 64, textAlignVertical: 'top' as const },
        row: { flexDirection: 'row' as const, gap: 12 },
        half: { flex: 1 },
        policyRow: { flexDirection: 'row' as const, gap: 12, marginTop: 12 },
        policyBtn: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        },
        policyBtnActive: {
          borderColor: colors.primary,
          backgroundColor: 'rgba(255, 0, 0, 0.08)',
        },
        policyBtnText: { fontSize: 14, fontWeight: '500' as const, color: colors.textMuted },
        policyBtnTextActive: { color: colors.primary, fontWeight: '600' as const },
        errorText: { fontSize: 13, color: colors.red, marginTop: 12 },
        actions: {
          flexDirection: 'row' as const,
          justifyContent: 'flex-end',
          gap: 12,
          padding: 20,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
        cancelText: { fontSize: 16, color: colors.textMuted, fontWeight: '500' as const },
        submitBtn: {
          backgroundColor: colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          minWidth: 140,
          alignItems: 'center',
        },
        submitBtnDisabled: { opacity: 0.7 },
        submitText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
      }),
    [colors]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Vytvořit turnaj</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Název turnaje *</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="Např. Čtvrtfinále"
              placeholderTextColor={colors.textMuted}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Popis (volitelné)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Popis turnaje"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setOverrideDefaults((v) => !v)}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, overrideDefaults && styles.checkboxChecked]}>
                {overrideDefaults ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>Přepsat výchozí nastavení</Text>
            </TouchableOpacity>

            {overrideDefaults && (
              <>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Piv na hráče</Text>
                    <TextInput
                      style={styles.input}
                      value={String(beersPerPlayer)}
                      onChangeText={(t) =>
                        setBeersPerPlayer(Math.max(1, Math.min(10, parseInt(t, 10) || 1)))
                      }
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Časové okno (min)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(timeWindowMinutes)}
                      onChangeText={(t) =>
                        setTimeWindowMinutes(Math.max(1, Math.min(60, parseInt(t, 10) || 5)))
                      }
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Okno pro zrušení (min)</Text>
                <TextInput
                  style={styles.input}
                  value={String(undoWindowMinutes)}
                  onChangeText={(t) =>
                    setUndoWindowMinutes(Math.max(1, Math.min(60, parseInt(t, 10) || 5)))
                  }
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />

                <Text style={styles.label}>Politika zrušení</Text>
                <View style={styles.policyRow}>
                  <TouchableOpacity
                    style={[
                      styles.policyBtn,
                      cancellationPolicy === CancellationPolicy.KEEP_BEERS && styles.policyBtnActive,
                    ]}
                    onPress={() => setCancellationPolicy(CancellationPolicy.KEEP_BEERS)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.policyBtnText,
                        cancellationPolicy === CancellationPolicy.KEEP_BEERS &&
                          styles.policyBtnTextActive,
                      ]}
                    >
                      Ponechat piva
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.policyBtn,
                      cancellationPolicy === CancellationPolicy.REMOVE_BEERS && styles.policyBtnActive,
                    ]}
                    onPress={() => setCancellationPolicy(CancellationPolicy.REMOVE_BEERS)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.policyBtnText,
                        cancellationPolicy === CancellationPolicy.REMOVE_BEERS &&
                          styles.policyBtnTextActive,
                      ]}
                    >
                      Odebrat piva
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Vytvořit turnaj</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
