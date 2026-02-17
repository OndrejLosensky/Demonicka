import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import type { BeerPongGame, BeerPongGameStatus, BeerPongRound } from '@demonicka/shared-types';

interface BeerPongGameModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game: BeerPongGame | null;
  undoWindowMinutes: number;
  /** When in DRAFT and a slot is empty, call this to open assign-team flow (then close this modal) */
  onRequestAssign?: (game: BeerPongGame, position: 'team1' | 'team2') => void;
}

function teamLabel(team: BeerPongGame['team1']): string {
  if (!team) return '—';
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

function statusLabel(status: BeerPongGameStatus): string {
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

export function BeerPongGameModal({
  visible,
  onClose,
  onSuccess,
  game,
  undoWindowMinutes,
  onRequestAssign,
}: BeerPongGameModalProps) {
  const token = useAuthStore((state) => state.token);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !game) {
      setSelectedWinner('');
      setUndoSecondsLeft(null);
      return;
    }
    if (game.status === 'IN_PROGRESS' && game.beersAddedAt) {
      const tick = () => {
        const addedAt = new Date(game!.beersAddedAt!).getTime();
        const end = addedAt + undoWindowMinutes * 60 * 1000;
        const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setUndoSecondsLeft(left > 0 ? left : null);
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, [visible, game, undoWindowMinutes]);

  if (!game) return null;

  const team1Name = teamLabel(game.team1);
  const team2Name = teamLabel(game.team2);
  const canUndo =
    game.status === 'IN_PROGRESS' && undoSecondsLeft !== null && undoSecondsLeft > 0;

  const handleStart = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await api.post(`/beer-pong/games/${game.id}/start`, {}, token);
      onSuccess();
      onClose();
    } catch {
      // keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!token || !selectedWinner) return;
    setIsSubmitting(true);
    try {
      await api.post(
        `/beer-pong/games/${game.id}/complete`,
        { winnerTeamId: selectedWinner },
        token
      );
      onSuccess();
      onClose();
    } catch {
      // keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await api.post(`/beer-pong/games/${game.id}/undo`, {}, token);
      onSuccess();
      onClose();
    } catch {
      // keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.roundTitle}>{roundLabel(game.round)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{statusLabel(game.status)}</Text>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.teamCard}>
              <Text style={styles.teamName} numberOfLines={1}>
                {team1Name}
              </Text>
              {game.winnerTeamId === game.team1Id && (
                <Text style={styles.winnerBadge}>Vítěz</Text>
              )}
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.teamCard}>
              <Text style={styles.teamName} numberOfLines={1}>
                {team2Name}
              </Text>
              {game.winnerTeamId === game.team2Id && (
                <Text style={styles.winnerBadge}>Vítěz</Text>
              )}
            </View>

            {canUndo && (
              <View style={styles.undoBanner}>
                <Text style={styles.undoText}>
                  Zrušit start: zbývá {formatTime(undoSecondsLeft!)}
                </Text>
              </View>
            )}

            {game.status === 'PENDING' && onRequestAssign && (
              <View style={styles.assignSection}>
                {!game.team1Id && (
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => {
                      onClose();
                      onRequestAssign(game, 'team1');
                    }}
                  >
                    <Text style={styles.assignBtnText}>Přiřadit tým 1</Text>
                  </TouchableOpacity>
                )}
                {!game.team2Id && (
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => {
                      onClose();
                      onRequestAssign(game, 'team2');
                    }}
                  >
                    <Text style={styles.assignBtnText}>Přiřadit tým 2</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {game.status === 'IN_PROGRESS' && !game.winnerTeamId && game.team1Id && game.team2Id && (
              <View style={styles.winnerSection}>
                <Text style={styles.winnerLabel}>Vybrat vítěze</Text>
                <TouchableOpacity
                  style={[
                    styles.winnerOption,
                    selectedWinner === game.team1Id && styles.winnerOptionActive,
                  ]}
                  onPress={() => setSelectedWinner(game.team1Id)}
                >
                  <Text
                    style={[
                      styles.winnerOptionText,
                      selectedWinner === game.team1Id && styles.winnerOptionTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {team1Name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.winnerOption,
                    selectedWinner === game.team2Id && styles.winnerOptionActive,
                  ]}
                  onPress={() => setSelectedWinner(game.team2Id)}
                >
                  <Text
                    style={[
                      styles.winnerOptionText,
                      selectedWinner === game.team2Id && styles.winnerOptionTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {team2Name}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            {game.status === 'PENDING' && (
              <>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Zavřít</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (isSubmitting || (!game.team1Id || !game.team2Id)) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleStart}
                  disabled={isSubmitting || !game.team1Id || !game.team2Id}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Spustit zápas</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {game.status === 'IN_PROGRESS' && !game.winnerTeamId && (
              <>
                {canUndo && (
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={handleUndo}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.outlineBtnText}>Zrušit start</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Zavřít</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (isSubmitting || !selectedWinner) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleComplete}
                  disabled={isSubmitting || !selectedWinner}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Dokončit (vyhrál vítěz)</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {game.status === 'COMPLETED' && (
              <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
                <Text style={styles.primaryBtnText}>Zavřít</Text>
              </TouchableOpacity>
            )}
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roundTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  statusBadge: { backgroundColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  body: { padding: 20, maxHeight: 360 },
  teamCard: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamName: { fontSize: 16, fontWeight: '600', color: '#111', flex: 1 },
  winnerBadge: { fontSize: 12, fontWeight: '600', color: '#16a34a', marginLeft: 8 },
  vs: { textAlign: 'center', fontSize: 14, color: '#6b7280', marginVertical: 8 },
  undoBanner: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  undoText: { fontSize: 13, color: '#92400e' },
  winnerSection: { marginTop: 16 },
  winnerLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  winnerOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  winnerOptionActive: { borderColor: '#FF0000', backgroundColor: 'rgba(255,0,0,0.08)' },
  winnerOptionText: { fontSize: 15, color: '#111' },
  winnerOptionTextActive: { color: '#FF0000', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  primaryBtn: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  outlineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#b45309',
    borderRadius: 10,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '500', color: '#b45309' },
  assignSection: { marginTop: 16, gap: 8 },
  assignBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  assignBtnText: { fontSize: 15, fontWeight: '500', color: '#111' },
});
