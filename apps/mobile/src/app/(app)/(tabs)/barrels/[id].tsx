import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../../store/auth.store';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { api } from '../../../../services/api';
import { parseError, logBackgroundError } from '../../../../utils/errorHandler';
import { Header } from '../../../../components/layout/Header';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { ErrorView } from '../../../../components/ui/ErrorView';
import { Icon } from '../../../../components/icons';
import { formatLitres, formatNumber } from '../../../../utils/format';
import type { Barrel } from '@demonicka/shared-types';

const BEER_VOLUME_LITRES = 0.5;

export default function BarrelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const token = useAuthStore((state) => state.token);
  const { activeEvent } = useActiveEvent();

  const [barrel, setBarrel] = useState<Barrel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBarrel = useCallback(async () => {
    if (!activeEvent?.id || !token || !id) return;

    try {
      setError(null);
      const barrels = await api.get<Barrel[]>(
        `/events/${activeEvent.id}/barrels`,
        token
      );
      const found = Array.isArray(barrels) ? barrels.find((b) => b.id === id) : null;
      setBarrel(found ?? null);
      if (!found) setError('Sud v této události nenalezen');
    } catch (e: unknown) {
      if (parseError(e).isNetworkError) {
        logBackgroundError(e, 'FetchBarrel');
      } else {
        const err = e as { message?: string };
        setError(err?.message ?? 'Nepodařilo se načíst sud');
      }
    }
  }, [activeEvent?.id, token, id]);

  useEffect(() => {
    setIsLoading(true);
    fetchBarrel().finally(() => setIsLoading(false));
  }, [fetchBarrel]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBarrel();
    setRefreshing(false);
  }, [fetchBarrel]);

  const handleRemoveFromEvent = useCallback(() => {
    if (!activeEvent?.id || !token || !id) return;

    Alert.alert(
      'Odebrat sud z události',
      'Opravdu chcete tento sud odebrat z události? Sud nebude smazán, pouze odpojen od události.',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Odebrat',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            try {
              await api.delete(
                `/events/${activeEvent.id}/barrels/${id}`,
                token
              );
              router.back();
            } catch (e: unknown) {
              if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
                logBackgroundError(e, 'RemoveBarrelFromEvent');
              } else {
                const err = e as { message?: string };
                Alert.alert('Chyba', err?.message ?? 'Sud se nepodařilo odebrat.');
              }
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  }, [activeEvent?.id, token, id, router]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        scroll: { flex: 1 },
        scrollContent: { padding: 16, paddingBottom: 32 },
        headerSection: { alignItems: 'center', marginBottom: 24 },
        barrelIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        },
        title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
        statusBadge: {
          backgroundColor: colors.bgSecondary,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginBottom: 4,
        },
        statusActive: { backgroundColor: colors.greenBg },
        statusText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
        statusTextActive: { color: colors.green },
        sizeLabel: { fontSize: 15, color: colors.textSecondary },
        card: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        },
        sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
        progressContainer: { marginBottom: 16 },
        progressBar: {
          height: 8,
          backgroundColor: colors.border,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 6,
        },
        progressFill: { height: '100%', backgroundColor: colors.textSecondary, borderRadius: 4 },
        progressText: { fontSize: 13, color: colors.textSecondary, textAlign: 'right' as const },
        statsRow: { flexDirection: 'row' as const, justifyContent: 'space-between' },
        statBlock: { alignItems: 'center', flex: 1 },
        statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
        statValue: { fontSize: 17, fontWeight: '600', color: colors.text },
        actionsSection: { paddingHorizontal: 8 },
        removeBtn: {
          flexDirection: 'row' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: colors.red,
        },
        removeBtnDisabled: { opacity: 0.6 },
        removeBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
      }),
    [colors]
  );

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (error || !barrel) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Detail sudu" showBack />
        <ErrorView message={error ?? 'Sud nenalezen'} onRetry={fetchBarrel} />
      </SafeAreaView>
    );
  }

  const totalLitres = Number(barrel.totalLitres ?? 0);
  const remainingLitres = Number(barrel.remainingLitres ?? 0);
  const progress =
    totalLitres > 0 ? ((totalLitres - remainingLitres) / totalLitres) * 100 : 0;
  const totalBeers = Math.round(totalLitres / BEER_VOLUME_LITRES);
  const remainingBeers = Math.floor(remainingLitres / BEER_VOLUME_LITRES);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Detail sudu" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.headerSection}>
          <View style={styles.barrelIconWrap}>
            <Icon name="barrel" size={40} color={colors.textSecondary} />
          </View>
          <Text style={styles.title}>Sud #{barrel.orderNumber}</Text>
          <View style={[styles.statusBadge, barrel.isActive && styles.statusActive]}>
            <Text style={[styles.statusText, barrel.isActive && styles.statusTextActive]}>
              {barrel.isActive ? 'Aktivní' : 'Prázdný'}
            </Text>
          </View>
          <Text style={styles.sizeLabel}>{barrel.size} l</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Stav</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)} % vypito</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Zbývá piv</Text>
              <Text style={styles.statValue}>{formatNumber(remainingBeers)}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Zbývá litrů</Text>
              <Text style={styles.statValue}>{formatLitres(barrel.remainingLitres)}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Celkem piv</Text>
              <Text style={styles.statValue}>{formatNumber(totalBeers)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.removeBtn, removing && styles.removeBtnDisabled]}
            onPress={handleRemoveFromEvent}
            disabled={removing}
          >
            <Icon name="remove" size={20} color="#fff" />
            <Text style={styles.removeBtnText}>
              {removing ? 'Odebírání…' : 'Odebrat z události'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
