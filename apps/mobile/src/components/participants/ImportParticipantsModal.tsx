import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { api } from '../../services/api';
import { Icon } from '../icons';
import type { User } from '@demonicka/shared-types';

interface ImportParticipantsModalProps {
  visible: boolean;
  eventId: string;
  token: string;
  onClose: () => void;
  onDone: () => void;
}

export function ImportParticipantsModal({
  visible,
  eventId,
  token,
  onClose,
  onDone,
}: ImportParticipantsModalProps) {
  const colors = useThemeColors();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [all, enrolled] = await Promise.all([
        api.get<User[]>('/users', token),
        api.get<User[]>(`/events/${eventId}/users`, token),
      ]);
      const enrolledIds = new Set((enrolled ?? []).map((u) => u.id));
      setAllUsers((all ?? []).filter((u) => !enrolledIds.has(u.id)));
    } catch {
      setError('Nepodařilo se načíst uživatele.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelected(new Set());
      fetchUsers();
    }
  }, [visible, fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleImport = async () => {
    if (selected.size === 0) return;
    setIsImporting(true);
    setError('');
    try {
      await Promise.all(
        Array.from(selected).map((userId) =>
          api.put(`/events/${eventId}/users/${userId}`, {}, token),
        ),
      );
      onDone();
      onClose();
    } catch {
      setError('Nepodařilo se přidat některé uživatele.');
    } finally {
      setIsImporting(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85%',
          paddingBottom: 24,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginTop: 12,
          marginBottom: 16,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginBottom: 12,
        },
        title: { fontSize: 20, fontWeight: '700', color: colors.text },
        closeBtn: { padding: 4 },
        searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
        searchInput: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          fontSize: 15,
          color: colors.text,
          backgroundColor: colors.inputBg,
        },
        listContent: { paddingHorizontal: 16, paddingBottom: 8 },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        },
        rowSelected: { backgroundColor: `${colors.primary}10` },
        avatar: {
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        avatarText: { fontSize: 16, fontWeight: '600', color: '#fff' },
        rowInfo: { flex: 1 },
        rowName: { fontSize: 15, fontWeight: '500', color: colors.text },
        rowMeta: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
        checkCircle: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkCircleActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        center: { alignItems: 'center', paddingVertical: 32 },
        emptyText: { fontSize: 15, color: colors.textMuted },
        errorText: {
          fontSize: 13,
          color: colors.red,
          textAlign: 'center',
          marginBottom: 8,
          paddingHorizontal: 16,
        },
        footer: {
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 12,
        },
        cancelBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        },
        cancelText: { fontSize: 16, fontWeight: '600', color: colors.text },
        importBtn: {
          flex: 2,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: colors.primary,
          alignItems: 'center',
        },
        importBtnDisabled: { opacity: 0.5 },
        importText: { fontSize: 16, fontWeight: '600', color: '#fff' },
      }),
    [colors],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Přidat existující uživatele</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Icon name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Hledat uživatele…"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>
                    {search ? 'Žádný uživatel neodpovídá hledání.' : 'Všichni uživatelé jsou již v události.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selected.has(item.id);
                const label = item.name || item.username || '?';
                return (
                  <TouchableOpacity
                    style={[styles.row, isSelected && styles.rowSelected]}
                    activeOpacity={0.7}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {label.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{label}</Text>
                      {item.username && item.name && (
                        <Text style={styles.rowMeta}>@{item.username}</Text>
                      )}
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      {isSelected && <Icon name="check" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isImporting}>
              <Text style={styles.cancelText}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importBtn, (selected.size === 0 || isImporting) && styles.importBtnDisabled]}
              onPress={handleImport}
              disabled={selected.size === 0 || isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.importText}>
                  {selected.size > 0 ? `Přidat (${selected.size})` : 'Přidat'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
