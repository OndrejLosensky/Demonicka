import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

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
  const [size, setSize] = useState<BarrelSize>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  sizeBtnActive: {
    borderColor: '#FF0000',
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
  },
  sizeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  sizeBtnTextActive: {
    color: '#FF0000',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
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
    color: '#6b7280',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#FF0000',
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
});
