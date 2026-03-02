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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColors } from '../../hooks/useThemeColors';
import { formatDateTimeLong } from '../../utils/format';
import type { CreateEventDto } from '@demonicka/shared-types';

function defaultStartDate(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function defaultEndDate(start: Date): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + 1);
  return d;
}

type PickerStep = 'date' | 'time';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventDto) => Promise<void>;
}

export function CreateEventModal({
  visible,
  onClose,
  onSubmit,
}: CreateEventModalProps) {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(() => defaultStartDate());
  const [endDate, setEndDate] = useState<Date>(() => defaultEndDate(defaultStartDate()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pickerField, setPickerField] = useState<'start' | 'end' | null>(null);
  const [pickerStep, setPickerStep] = useState<PickerStep>('date');

  useEffect(() => {
    if (visible) {
      const start = defaultStartDate();
      const end = defaultEndDate(start);
      setName('');
      setDescription('');
      setStartDate(start);
      setEndDate(end);
      setError('');
      setPickerField(null);
    }
  }, [visible]);

  const openStartPicker = () => {
    setPickerField('start');
    setPickerStep(Platform.OS === 'ios' ? 'date' : 'date');
  };

  const openEndPicker = () => {
    setPickerField('end');
    setPickerStep(Platform.OS === 'ios' ? 'date' : 'date');
  };

  const handlePickerChange = (_event: unknown, value: Date | undefined) => {
    if (value == null) {
      setPickerField(null);
      return;
    }
    const type = (_event as { type: string }).type;
    if (type === 'dismissed') {
      setPickerField(null);
      return;
    }
    if (pickerField === 'start') {
      if (Platform.OS === 'android' && pickerStep === 'date') {
        setStartDate((prev) => {
          const next = new Date(prev);
          next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
          return next;
        });
        setPickerStep('time');
        return;
      }
      if (Platform.OS === 'android' && pickerStep === 'time') {
        setStartDate((prev) => {
          const next = new Date(prev);
          next.setHours(value.getHours(), value.getMinutes(), 0, 0);
          return next;
        });
        setPickerField(null);
        return;
      }
      setStartDate(value);
      setPickerField(null);
      return;
    }
    if (pickerField === 'end') {
      if (Platform.OS === 'android' && pickerStep === 'date') {
        setEndDate((prev) => {
          const next = new Date(prev);
          next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
          return next;
        });
        setPickerStep('time');
        return;
      }
      if (Platform.OS === 'android' && pickerStep === 'time') {
        setEndDate((prev) => {
          const next = new Date(prev);
          next.setHours(value.getHours(), value.getMinutes(), 0, 0);
          return next;
        });
        setPickerField(null);
        return;
      }
      setEndDate(value);
      setPickerField(null);
    }
  };

  const showDateTimePicker = pickerField !== null && Platform.OS === 'ios';
  const showDatePicker =
    pickerField !== null && Platform.OS === 'android' && pickerStep === 'date';
  const showTimePicker =
    pickerField !== null && Platform.OS === 'android' && pickerStep === 'time';

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Zadejte název události');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('Konec musí být po začátku');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmed,
        description: description.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      onClose();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Nepodařilo se vytvořit událost';
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
          maxHeight: '90%',
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
        inputMultiline: {
          minHeight: 72,
          textAlignVertical: 'top' as const,
        },
        dateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: colors.inputBg,
        },
        dateRowText: { fontSize: 16, color: colors.text },
        dateRowChevron: { fontSize: 14, color: colors.textMuted },
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
        cancelText: { fontSize: 16, color: colors.textMuted, fontWeight: '500' },
        submitBtn: {
          backgroundColor: colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          minWidth: 120,
          alignItems: 'center',
        },
        submitBtnDisabled: { opacity: 0.7 },
        submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
          <Text style={styles.title}>Vytvořit událost</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Název události *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError('');
              }}
              placeholder="Např. Letní festival 2025"
              placeholderTextColor={colors.textMuted}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Popis (volitelné)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Popis události"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Začátek *</Text>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={openStartPicker}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.dateRowText}>{formatDateTimeLong(startDate.toISOString())}</Text>
              <Text style={styles.dateRowChevron}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Konec *</Text>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={openEndPicker}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.dateRowText}>{formatDateTimeLong(endDate.toISOString())}</Text>
              <Text style={styles.dateRowChevron}>▾</Text>
            </TouchableOpacity>

            {showDateTimePicker && (
              <DateTimePicker
                value={pickerField === 'start' ? startDate : endDate}
                mode="datetime"
                display="spinner"
                onChange={handlePickerChange}
                minimumDate={pickerField === 'end' ? startDate : undefined}
              />
            )}
            {showDatePicker && (
              <DateTimePicker
                value={pickerField === 'start' ? startDate : endDate}
                mode="date"
                display="default"
                onChange={handlePickerChange}
                minimumDate={pickerField === 'end' ? startDate : undefined}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={pickerField === 'start' ? startDate : endDate}
                mode="time"
                display="default"
                onChange={handlePickerChange}
              />
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
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
                <Text style={styles.submitText}>Vytvořit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
