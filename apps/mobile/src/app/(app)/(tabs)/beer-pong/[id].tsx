import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { Header } from '../../../../components/layout/Header';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { BeerPongTeamModal } from '../../../../components/beer-pong/BeerPongTeamModal';
import { BeerPongGameModal } from '../../../../components/beer-pong/BeerPongGameModal';
import { BeerPongAssignTeamModal } from '../../../../components/beer-pong/BeerPongAssignTeamModal';
import type {
  BeerPongEvent,
  BeerPongEventStatus,
  BeerPongTeam,
  BeerPongGame,
  BeerPongRound,
} from '@demonicka/shared-types';

function getStatusLabel(status: BeerPongEventStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Příprava';
    case 'ACTIVE':
      return 'Probíhá';
    case 'COMPLETED':
      return 'Dokončeno';
    default:
      return status;
  }
}

function getStatusColor(status: BeerPongEventStatus): string {
  switch (status) {
    case 'DRAFT':
      return '#6b7280';
    case 'ACTIVE':
      return '#16a34a';
    case 'COMPLETED':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

function teamDisplayName(team: BeerPongTeam): string {
  if (team.name?.trim()) return team.name;
  const p1 = team.player1?.name || team.player1?.username || '?';
  const p2 = team.player2?.name || team.player2?.username || '?';
  return `${p1} & ${p2}`;
}

function roundLabel(round: BeerPongRound): string {
  switch (round) {
    case 'QUARTERFINAL':
      return 'Čtvrtfinále';
    case 'SEMIFINAL':
      return 'Semifinále';
    case 'FINAL':
      return 'Finále';
    default:
      return round;
  }
}

function gameRowLabel(g: BeerPongGame): string {
  const t1 = g.team1 ? teamDisplayName(g.team1) : '—';
  const t2 = g.team2 ? teamDisplayName(g.team2) : '—';
  return `${t1} vs ${t2}`;
}

function gameStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Čeká';
    case 'IN_PROGRESS':
      return 'Probíhá';
    case 'COMPLETED':
      return 'Dokončeno';
    default:
      return status;
  }
}

export default function BeerPongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const [tournament, setTournament] = useState<BeerPongEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 Bracket, 1 Teams, 2 Settings
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<BeerPongGame | null>(null);
  const [assignGame, setAssignGame] = useState<BeerPongGame | null>(null);
  const [assignPosition, setAssignPosition] = useState<'team1' | 'team2' | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);

  const fetchTournament = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const data = await api.get<BeerPongEvent>(`/beer-pong/${id}`, token);
      setTournament(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Nepodařilo se načíst turnaj');
      setTournament(null);
    }
  }, [token, id]);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetchTournament().finally(() => setIsLoading(false));
    }
  }, [id, fetchTournament]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTournament();
    setRefreshing(false);
  }, [fetchTournament]);

  const handleStart = useCallback(async () => {
    if (!id || !token) return;
    setActionLoading(true);
    try {
      await api.post(`/beer-pong/${id}/start`, {}, token);
      setStartConfirmOpen(false);
      await fetchTournament();
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Spuštění se nepovedlo');
    } finally {
      setActionLoading(false);
    }
  }, [id, token, fetchTournament]);

  const handleComplete = useCallback(async () => {
    if (!id || !token) return;
    setActionLoading(true);
    try {
      await api.post(`/beer-pong/${id}/complete`, {}, token);
      setCompleteConfirmOpen(false);
      await fetchTournament();
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Dokončení se nepovedlo');
    } finally {
      setActionLoading(false);
    }
  }, [id, token, fetchTournament]);

  const handleDeleteTeam = useCallback(async () => {
    if (!id || !token || !deleteTeamId) return;
    try {
      await api.delete(`/beer-pong/${id}/teams/${deleteTeamId}`, token);
      setDeleteTeamId(null);
      await fetchTournament();
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Smazání se nepovedlo');
    }
  }, [id, token, deleteTeamId, fetchTournament]);

  const gamesByRound = useMemo(() => {
    const games = tournament?.games ?? [];
    const quarters = games.filter((g) => g.round === 'QUARTERFINAL').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const semis = games.filter((g) => g.round === 'SEMIFINAL').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const final = games.filter((g) => g.round === 'FINAL')[0];
    return { quarters, semis, final };
  }, [tournament?.games]);

  if (isLoading) return <LoadingScreen showLogo={false} />;

  if (error && !tournament) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Turnaj" showBack />
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTournament()}>
            <Text style={styles.retryBtnText}>Zkusit znovu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!tournament) return null;

  const teamCount = tournament.teams?.length ?? 0;
  const canStart = tournament.status === 'DRAFT' && teamCount === 8;
  const canAddTeams = tournament.status === 'DRAFT' && teamCount < 8;
  const canDeleteTeams = tournament.status === 'DRAFT';
  const canComplete =
    tournament.status === 'ACTIVE' &&
    tournament.games?.some((g) => g.round === 'FINAL' && g.winnerTeamId);
  const teams = tournament.teams ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={tournament.name} showBack />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 0 && styles.tabActive]}
          onPress={() => setActiveTab(0)}
        >
          <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>Mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 1 && styles.tabActive]}
          onPress={() => setActiveTab(1)}
        >
          <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>Týmy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 2 && styles.tabActive]}
          onPress={() => setActiveTab(2)}
        >
          <Text style={[styles.tabText, activeTab === 2 && styles.tabTextActive]}>Nastavení</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 0 && (
          <View style={styles.tabContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(tournament.status) }]}>
                  {getStatusLabel(tournament.status)}
                </Text>
              </View>
            </View>

            {(canStart || canComplete) && (
              <View style={styles.actionRow}>
                {canStart && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setStartConfirmOpen(true)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.primaryBtnText}>Spustit turnaj</Text>
                  </TouchableOpacity>
                )}
                {canComplete && (
                  <TouchableOpacity
                    style={[styles.primaryBtn, styles.primaryBtnSuccess]}
                    onPress={() => setCompleteConfirmOpen(true)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.primaryBtnText}>Dokončit turnaj</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {tournament.games && tournament.games.length > 0 ? (
              <>
                {gamesByRound.quarters.length > 0 && (
                  <View style={styles.roundSection}>
                    <Text style={styles.roundTitle}>{roundLabel('QUARTERFINAL')}</Text>
                    {gamesByRound.quarters.map((g) => (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.gameCard}
                        onPress={() => setSelectedGame(g)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.gameRowText} numberOfLines={1}>
                          {gameRowLabel(g)}
                        </Text>
                        <View style={styles.gameStatusWrap}>
                          <Text style={styles.gameStatusText}>{gameStatusLabel(g.status)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {gamesByRound.semis.length > 0 && (
                  <View style={styles.roundSection}>
                    <Text style={styles.roundTitle}>{roundLabel('SEMIFINAL')}</Text>
                    {gamesByRound.semis.map((g) => (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.gameCard}
                        onPress={() => setSelectedGame(g)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.gameRowText} numberOfLines={1}>
                          {gameRowLabel(g)}
                        </Text>
                        <View style={styles.gameStatusWrap}>
                          <Text style={styles.gameStatusText}>{gameStatusLabel(g.status)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {gamesByRound.final && (
                  <View style={styles.roundSection}>
                    <Text style={styles.roundTitle}>{roundLabel('FINAL')}</Text>
                    <TouchableOpacity
                      style={styles.gameCard}
                      onPress={() => setSelectedGame(gamesByRound.final!)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.gameRowText} numberOfLines={1}>
                        {gameRowLabel(gamesByRound.final)}
                      </Text>
                      <View style={styles.gameStatusWrap}>
                        <Text style={styles.gameStatusText}>
                          {gameStatusLabel(gamesByRound.final.status)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyHint}>
                Zápasy se zobrazí po spuštění turnaje. Nejdříve přidejte 8 týmů v záložce Týmy.
              </Text>
            )}
          </View>
        )}

        {activeTab === 1 && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Týmy ({teamCount}/8)</Text>
              {canAddTeams && (
                <TouchableOpacity
                  style={styles.addTeamBtn}
                  onPress={() => setTeamModalOpen(true)}
                >
                  <Text style={styles.addTeamBtnText}>+ Přidat tým</Text>
                </TouchableOpacity>
              )}
            </View>

            {teams.length === 0 ? (
              <Text style={styles.emptyHint}>
                Žádné týmy. Přidejte týmy tlačítkem „Přidat tým“. Potřebujete 8 týmů pro start.
              </Text>
            ) : (
              teams.map((team, idx) => (
                <View key={team.id} style={styles.teamCard}>
                  <View style={styles.teamCardMain}>
                    <Text style={styles.teamIndex}>{idx + 1}.</Text>
                    <Text style={styles.teamName} numberOfLines={1}>
                      {teamDisplayName(team)}
                    </Text>
                    {canDeleteTeams && (
                      <TouchableOpacity
                        style={styles.deleteTeamBtn}
                        onPress={() => setDeleteTeamId(team.id)}
                      >
                        <Text style={styles.deleteTeamBtnText}>Smazat</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.teamPlayers} numberOfLines={1}>
                    {team.player1?.name || team.player1?.username || '?'} &{' '}
                    {team.player2?.name || team.player2?.username || '?'}
                  </Text>
                </View>
              ))
            )}

            {teamCount < 8 && tournament.status === 'DRAFT' && (
              <Text style={styles.hint}>Chybí {8 - teamCount} týmů pro start turnaje.</Text>
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.tabContent}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Piv na hráče</Text>
              <Text style={styles.settingsValue}>{tournament.beersPerPlayer}</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Časové okno (min)</Text>
              <Text style={styles.settingsValue}>{tournament.timeWindowMinutes}</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Okno pro zrušení (min)</Text>
              <Text style={styles.settingsValue}>{tournament.undoWindowMinutes}</Text>
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Politika zrušení</Text>
              <Text style={styles.settingsValue}>
                {tournament.cancellationPolicy === 'KEEP_BEERS' ? 'Ponechat piva' : 'Odebrat piva'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <BeerPongTeamModal
        visible={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSuccess={() => {
          fetchTournament();
          setTeamModalOpen(false);
        }}
        beerPongEventId={id!}
        eventId={tournament.eventId}
        existingTeams={teams}
      />

      {selectedGame && (
        <BeerPongGameModal
          visible={!!selectedGame && !assignGame}
          onClose={() => setSelectedGame(null)}
          onSuccess={() => {
            fetchTournament();
            setSelectedGame(null);
          }}
          game={selectedGame}
          undoWindowMinutes={tournament.undoWindowMinutes ?? 5}
          onRequestAssign={
            tournament.status === 'DRAFT'
              ? (game, position) => {
                  setSelectedGame(null);
                  setAssignGame(game);
                  setAssignPosition(position);
                }
              : undefined
          }
        />
      )}

      {assignGame && assignPosition && (
        <BeerPongAssignTeamModal
          visible={!!assignGame}
          onClose={() => {
            setAssignGame(null);
            setAssignPosition(null);
          }}
          onSuccess={() => {
            fetchTournament();
            setAssignGame(null);
            setAssignPosition(null);
          }}
          game={assignGame}
          position={assignPosition}
          existingTeams={teams}
          beerPongEventId={id!}
          eventId={tournament.eventId}
        />
      )}

      {/* Delete team confirm */}
      <Modal visible={!!deleteTeamId} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Smazat tým?</Text>
            <Text style={styles.confirmMessage}>
              Opravdu chcete odebrat tento tým z turnaje?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setDeleteTeamId(null)}>
                <Text style={styles.confirmCancel}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteTeam()}>
                <Text style={styles.confirmOk}>Smazat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Start tournament confirm */}
      <Modal visible={startConfirmOpen} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Spustit turnaj?</Text>
            <Text style={styles.confirmMessage}>
              Turnaj bude aktivní a zápasy budou přiřazeny. Tuto akci nelze vrátit.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setStartConfirmOpen(false)}>
                <Text style={styles.confirmCancel}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleStart()} disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FF0000" />
                ) : (
                  <Text style={styles.confirmOk}>Spustit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete tournament confirm */}
      <Modal visible={completeConfirmOpen} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Dokončit turnaj?</Text>
            <Text style={styles.confirmMessage}>
              Turnaj bude označen jako dokončený. Tuto akci nelze vrátit.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setCompleteConfirmOpen(false)}>
                <Text style={styles.confirmCancel}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleComplete()} disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <Text style={[styles.confirmOk, { color: '#16a34a' }]}>Dokončit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#FF0000' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#FF0000', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  tabContent: {},
  statusRow: { marginBottom: 16 },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryBtnSuccess: { backgroundColor: '#16a34a' },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  roundSection: { marginBottom: 24 },
  roundTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 10 },
  gameCard: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gameRowText: { fontSize: 15, color: '#111', marginBottom: 4 },
  gameStatusWrap: {},
  gameStatusText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  addTeamBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FF0000',
  },
  addTeamBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  teamCard: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teamCardMain: { flexDirection: 'row', alignItems: 'center' },
  teamIndex: { fontSize: 14, color: '#6b7280', width: 28 },
  teamName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111' },
  deleteTeamBtn: { padding: 6 },
  deleteTeamBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '500' },
  teamPlayers: { fontSize: 13, color: '#6b7280', marginTop: 6, marginLeft: 28 },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  hint: { fontSize: 13, color: '#6b7280', marginTop: 16 },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsLabel: { fontSize: 15, color: '#6b7280' },
  settingsValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  errorWrap: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  retryBtnText: { fontSize: 16, color: '#FF0000', fontWeight: '600' },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  confirmMessage: { fontSize: 15, color: '#6b7280', marginBottom: 20 },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  confirmCancel: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  confirmOk: { fontSize: 16, fontWeight: '600', color: '#FF0000' },
});
