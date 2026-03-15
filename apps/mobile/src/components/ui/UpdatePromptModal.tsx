import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface UpdatePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isLoading?: boolean;
}

export function UpdatePromptModal({
  visible,
  onClose,
  onUpdate,
  isLoading = false,
}: UpdatePromptModalProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Nová verze aplikace
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Je k dispozici nová verze aplikace. Chcete ji nyní stáhnout a
            restartovat aplikaci?
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.buttonSecondary, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>
                Zrušit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}
              onPress={onUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Aktualizovat</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  buttonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
