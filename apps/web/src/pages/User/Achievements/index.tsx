import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Card,
  Button,
  Divider,
  Grid,
  LinearProgress,
  MetricCard,
  Typography,
  EmojiEvents,
  LocalBar,
  SportsBar,
  CalendarToday,
  AccessTime,
  Event as EventIcon,
  Group as GroupIcon,
} from '@demonicka/ui';
import { alpha } from '@mui/material/styles';
import { useToast } from '../../../hooks/useToast';
import { achievementsService } from '../../../services/achievementsService';
import type {
  UserAchievementsResponse,
  GlobalAchievementsResponse,
  GlobalAchievement,
  UserAchievement,
  AchievementType,
} from '@demonicka/shared-types';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';

const AchievementTypeIcon: React.FC<{ type: AchievementType }> = ({ type }) => {
  switch (type) {
    case 'TOTAL_BEERS':
    case 'BEERS_IN_EVENT':
      return <LocalBar fontSize="small" />;
    case 'BEERS_IN_HOUR':
      return <AccessTime fontSize="small" />;
    case 'EVENTS_PARTICIPATED':
      return <GroupIcon fontSize="small" />;
    case 'EVENT_WIN':
      return <EmojiEvents fontSize="small" />;
    case 'CONSECUTIVE_DAYS':
      return <CalendarToday fontSize="small" />;
    case 'FIRST_BEER':
      return <EventIcon fontSize="small" />;
    case 'BEER_PONG_GAMES_PLAYED':
    case 'BEER_PONG_GAMES_WON':
    case 'BEER_PONG_FINALS_WON':
      return <SportsBar fontSize="small" />;
    default:
      return <EmojiEvents fontSize="small" />;
  }
};

const getProgressPercent = (progress: number, target: number) => {
  if (target <= 0) return 0;
  return Math.min((progress / target) * 100, 100);
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '0%';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

export const AchievementsPage: React.FC = () => {
  const [view, setView] = useState<'my' | 'global'>('my');

  const [myAchievements, setMyAchievements] =
    useState<UserAchievementsResponse | null>(null);
  const [isMyLoading, setIsMyLoading] = useState(true);
  const [myError, setMyError] = useState<string | null>(null);

  const [globalAchievements, setGlobalAchievements] =
    useState<GlobalAchievementsResponse | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const toast = useToast();

  const loadMyAchievements = useCallback(async () => {
    try {
      setIsMyLoading(true);
      setMyError(null);
      const data = await achievementsService.getMyAchievements();
      setMyAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      setMyError('Failed to load achievements');
      // Don't call toast.error here to avoid infinite loops
    } finally {
      setIsMyLoading(false);
    }
  }, []); // Remove isLoading dependency to prevent infinite loops

  useEffect(() => {
    loadMyAchievements();
  }, [loadMyAchievements]);

  const loadGlobalAchievements = useCallback(async () => {
    try {
      setIsGlobalLoading(true);
      setGlobalError(null);
      const data = await achievementsService.getGlobalAchievements();
      setGlobalAchievements(data);
    } catch (error) {
      console.error('Failed to load global achievements:', error);
      setGlobalError('Failed to load global achievements');
    } finally {
      setIsGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view !== 'global') return;
    if (globalAchievements) return;
    if (isGlobalLoading) return;
    loadGlobalAchievements();
  }, [view, globalAchievements, isGlobalLoading, loadGlobalAchievements]);

  const checkAchievements = useCallback(async () => {
    try {
      await achievementsService.checkAchievements();
      await loadMyAchievements(); // Reload to get updated data

      // If the global view is already loaded, refresh it too (it includes "my progress").
      if (globalAchievements) {
        await loadGlobalAchievements();
      }

      toast.success('Achievements checked successfully');
    } catch (error) {
      console.error('Failed to check achievements:', error);
      toast.error('Failed to check achievements');
    }
  }, [loadMyAchievements, loadGlobalAchievements, globalAchievements, toast]);

  const headerAction = useMemo(
    () =>
      view === 'my' && myAchievements ? (
        <Button variant="contained" color="primary" onClick={checkAchievements}>
          Zkontrolovat úspěchy
        </Button>
      ) : undefined,
    [view, myAchievements, checkAchievements],
  );
  useDashboardHeaderSlots({ action: headerAction });

  const mySorted = useMemo(() => {
    if (!myAchievements) return [];
    return [...myAchievements.achievements].sort((a, b) => {
      if (a.achievement.category !== b.achievement.category) {
        return a.achievement.category.localeCompare(b.achievement.category);
      }
      return a.achievement.name.localeCompare(b.achievement.name);
    });
  }, [myAchievements]);

  const renderMyListRow = (userAchievement: UserAchievement) => {
    const progressPercent = getProgressPercent(
      userAchievement.progress,
      userAchievement.achievement.targetValue,
    );

    return (
      <Box
        key={userAchievement.id}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          py: 1.5,
          px: 0.5,
          borderRadius: 1.5,
          backgroundColor: userAchievement.isCompleted
            ? alpha(theme.palette.success.main, 0.08)
            : 'transparent',
          transition: theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
          }),
          '&:hover': {
            backgroundColor: userAchievement.isCompleted
              ? alpha(theme.palette.success.main, 0.12)
              : theme.palette.action.hover,
          },
        })}
      >
        <Box
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: theme.palette.action.selected,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: theme.palette.text.secondary,
          })}
        >
          <AchievementTypeIcon type={userAchievement.achievement.type} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {userAchievement.achievement.name}
            </Typography>
          </Box>

          {userAchievement.achievement.description && (
            <Typography
              variant="body2"
              sx={{ mt: 0.5, color: 'text.secondary' }}
            >
              {userAchievement.achievement.description}
            </Typography>
          )}

          <Box sx={{ mt: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
                color: 'text.secondary',
              }}
            >
              <Typography variant="caption">Pokrok</Typography>
              <Typography variant="caption">
                {userAchievement.progress} / {userAchievement.achievement.targetValue}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 6, borderRadius: 999 }}
            />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right', minWidth: 96 }}>
          {userAchievement.completedAt && (
            <Typography variant="caption" color="text.secondary">
              {new Date(userAchievement.completedAt).toLocaleDateString('cs-CZ')}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderGlobalListRow = (row: GlobalAchievement) => {
    const progressPercent = getProgressPercent(
      row.progress,
      row.achievement.targetValue,
    );

    return (
      <Box
        key={row.id}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          py: 1.5,
          px: 0.5,
          borderRadius: 1.5,
          backgroundColor: row.isCompleted
            ? alpha(theme.palette.success.main, 0.08)
            : 'transparent',
          transition: theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
          }),
          '&:hover': {
            backgroundColor: row.isCompleted
              ? alpha(theme.palette.success.main, 0.12)
              : theme.palette.action.hover,
          },
        })}
      >
        <Box
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: 2,
            backgroundColor: theme.palette.action.selected,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: theme.palette.text.secondary,
          })}
        >
          <AchievementTypeIcon type={row.achievement.type} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {row.achievement.name}
            </Typography>
          </Box>

          {row.achievement.description && (
            <Typography
              variant="body2"
              sx={{ mt: 0.5, color: 'text.secondary' }}
            >
              {row.achievement.description}
            </Typography>
          )}

          <Box sx={{ mt: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
                color: 'text.secondary',
              }}
            >
              <Typography variant="caption">Tvůj pokrok</Typography>
              <Typography variant="caption">
                {row.progress} / {row.achievement.targetValue}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 6, borderRadius: 999 }}
            />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right', minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">
            Vzácnost
          </Typography>
          <Typography variant="subtitle2">
            {formatPercent(row.globalCompletionPercent)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Button
          variant={view === 'my' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView('my')}
        >
          Moje úspěchy
        </Button>
        <Button
          variant={view === 'global' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView('global')}
        >
          Globální
        </Button>
      </div>

      {view === 'my' && (
        <>
          {isMyLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {!isMyLoading && myError && (
            <div className="text-center text-red-600 p-4">
              <p>{myError}</p>
              <button
                onClick={() => loadMyAchievements()}
                className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Retry
              </button>
            </div>
          )}

          {!isMyLoading && !myError && myAchievements && (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard title="Celkem bodů" value={myAchievements.totalPoints} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Dokončené"
                    value={myAchievements.completedCount}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard title="Celkem úspěchů" value={myAchievements.totalCount} color="info" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Procento dokončení"
                    value={`${myAchievements.totalCount > 0 ? Math.round((myAchievements.completedCount / myAchievements.totalCount) * 100) : 0}%`}
                    color="warning"
                  />
                </Grid>
              </Grid>

              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Seznam úspěchů</h2>
                  <span className="text-sm text-gray-500">
                    {myAchievements.completedCount}/{myAchievements.totalCount}
                  </span>
                </div>

                {mySorted.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-lg font-semibold mb-2">Zatím žádné úspěchy</h3>
                    <p className="text-gray-600">
                      Začněte pít pivo a sbírejte úspěchy! Vaše pokroky se zde zobrazí.
                    </p>
                  </div>
                ) : (
                  <Box>
                    {mySorted.map((ua, idx) => (
                      <React.Fragment key={ua.id}>
                        {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                        {renderMyListRow(ua)}
                      </React.Fragment>
                    ))}
                  </Box>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {view === 'global' && (
        <>
          {isGlobalLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {!isGlobalLoading && globalError && (
            <div className="text-center text-red-600 p-4">
              <p>{globalError}</p>
              <button
                onClick={() => loadGlobalAchievements()}
                className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Retry
              </button>
            </div>
          )}

          {!isGlobalLoading && !globalError && globalAchievements && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Globální úspěchy</h2>
                <span className="text-sm text-gray-500">
                  {globalAchievements.totalUsers} uživatelů
                </span>
              </div>

              {globalAchievements.achievements.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  Žádné úspěchy k zobrazení.
                </div>
              ) : (
                <Box>
                  {globalAchievements.achievements.map((a, idx) => (
                    <React.Fragment key={a.id}>
                      {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                      {renderGlobalListRow(a)}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}; 