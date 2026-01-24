import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/auth.store';
import { useRole } from '../../../hooks/useRole';
import { api } from '../../../services/api';
import { Header } from '../../../components/layout/Header';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { User } from '@demonicka/shared-types';

export default function UsersManagementScreen() {
  const token = useAuthStore((state) => state.token);
  const { isAdmin } = useRole();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!token) return;

    try {
      const data = await api.get<User[]>('/users', token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    fetchUsers().finally(() => setIsLoading(false));
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name?.toLowerCase().includes(query) ||
            u.username?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'OPERATOR':
        return 'Operátor';
      case 'USER':
        return 'Uživatel';
      case 'PARTICIPANT':
        return 'Účastník';
      default:
        return role;
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.name || item.username || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || item.username}</Text>
        <Text style={styles.userMeta}>
          @{item.username} • {getRoleLabel(item.role)}
        </Text>
      </View>
      <View style={[styles.statusDot, item.canLogin && styles.statusActive]} />
    </TouchableOpacity>
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Správa uživatelů" showBack />
        <EmptyState
          icon="🔒"
          title="Přístup odepřen"
          message="Nemáte oprávnění k této sekci."
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Správa uživatelů" showBack />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Hledat uživatele..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="Žádní uživatelé"
            message={
              searchQuery
                ? 'Žádný uživatel neodpovídá hledání.'
                : 'Zatím nejsou žádní uživatelé.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  userMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e5e7eb',
  },
  statusActive: {
    backgroundColor: '#16a34a',
  },
});
