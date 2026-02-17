import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';

type Gender = 'MALE' | 'FEMALE';

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (username: string, gender: Gender) => Promise<void>;
}

export function AddParticipantModal({
  visible,
  onClose,
  onSubmit,
}: AddParticipantModalProps) {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setUsername('');
      setGender('MALE');
      setError('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Zadejte jméno');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, gender);
      onClose();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Nepodařilo se přidat účastníka';
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>Přidat účastníka</Text>

              <Text style={styles.label}>Jméno</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError('');
                }}
                placeholder="Jméno účastníka"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                editable={!isSubmitting}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Text style={styles.label}>Pohlaví</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'MALE' && styles.genderBtnActive]}
                  onPress={() => setGender('MALE')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.genderText, gender === 'MALE' && styles.genderTextActive]}>
                    Muž
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'FEMALE' && styles.genderBtnActive]}
                  onPress={() => setGender('FEMALE')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.genderText, gender === 'FEMALE' && styles.genderTextActive]}>
                    Žena
                  </Text>
                </TouchableOpacity>
              </View>

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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: '#FF0000',
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
  },
  genderText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  genderTextActive: {
    color: '#FF0000',
    fontWeight: '600',
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
