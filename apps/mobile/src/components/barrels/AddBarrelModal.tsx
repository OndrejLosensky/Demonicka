import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

export type BarrelSize = 15 | 30 | 50;

const SIZES: BarrelSize[] = [15, 30, 50];

interface AddBarrelModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (size: BarrelSize) => Promise<void>;
}

export function AddBarrelModal({
  visible,
  onClose,
  onSubmit,
}: AddBarrelModalProps) {
  const colors = useThemeColors();
  const [size, setSize] = useState<BarrelSize>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          padding: 20,
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 20,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 10,
        },
        sizeRow: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24,
        },
        sizeBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        },
        sizeBtnActive: {
          borderColor: colors.primary,
          backgroundColor: 'rgba(255, 0, 0, 0.08)',
        },
        sizeBtnText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textMuted,
        },
        sizeBtnTextActive: {
          color: colors.primary,
        },
        errorText: {
          fontSize: 13,
          color: colors.red,
          marginBottom: 12,
        },
        actions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 12,
        },
        cancelBtn: {
          paddingVertical: 10,
          paddingHorizontal: 16,
        },
        cancelText: {
          fontSize: 16,
          color: colors.textMuted,
          fontWeight: '500',
        },
        submitBtn: {
          backgroundColor: colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          minWidth: 100,
          alignItems: 'center',
        },
        submitBtnDisabled: {
          opacity: 0.7,
        },
        submitText: {
          fontSize: 16,
          fontWeight: '600',
          color: '#fff',
        },
      }),
    [colors]
  );

  useEffect(() => {
    if (visible) {
      setSize(30);
      setError('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(size);
      onClose();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Nepodařilo se přidat sud';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Přidat sud</Text>
          <Text style={styles.label}>Velikost</Text>
          <View style={styles.sizeRow}>
            {SIZES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sizeBtn, size === s && styles.sizeBtnActive]}
                onPress={() => setSize(s)}
                disabled={isSubmitting}
              >
                <Text style={[styles.sizeBtnText, size === s && styles.sizeBtnTextActive]}>
                  {s}L
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                <Text style={styles.submitText}>Přidat</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
