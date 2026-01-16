import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../hooks/useToast';
import { achievementsService } from '../../../services/achievementsService';
import { usePageTitle } from '../../../hooks/usePageTitle';
import type { UserAchievementsResponse, UserAchievement } from '@demonicka/shared-types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { MetricCard } from '../../../components/ui/MetricCard';
import { Button, Grid } from '@mui/material';

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'BEGINNER':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'INTERMEDIATE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ADVANCED':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'EXPERT':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'LEGENDARY':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getProgressColor = (progress: number, target: number) => {
  const percentage = (progress / target) * 100;
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-gray-300';
};

export const AchievementsPage: React.FC = () => {
  usePageTitle('Úspěchy');
  const [achievements, setAchievements] = useState<UserAchievementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadAchievements = useCallback(async () => {
    console.log('loadAchievements called');
    try {
      setIsLoading(true);
      setError(null);
      console.log('Making API call to /achievements/my');
      const data = await achievementsService.getMyAchievements();
      console.log('API response:', data);
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      setError('Failed to load achievements');
      // Don't call toast.error here to avoid infinite loops
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove isLoading dependency to prevent infinite loops

  useEffect(() => {
    console.log('Achievements useEffect triggered');
    loadAchievements();
  }, [loadAchievements]);

  const checkAchievements = async () => {
    try {
      await achievementsService.checkAchievements();
      await loadAchievements(); // Reload to get updated data
      toast.success('Achievements checked successfully');
    } catch (error) {
      console.error('Failed to check achievements:', error);
      toast.error('Failed to check achievements');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => loadAchievements()} 
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!achievements) {
    return (
      <div className="text-center text-gray-600 p-4">
        No achievements available
      </div>
    );
  }

  const groupedAchievements = achievements.achievements.reduce((acc, achievement) => {
    const category = achievement.achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, UserAchievement[]>);

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        title="Moje úspěchy"
        action={
          <Button variant="contained" color="primary" onClick={checkAchievements}>
            Zkontrolovat úspěchy
          </Button>
        }
      />

      {/* Summary Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Celkem bodů" value={achievements.totalPoints} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Dokončené" value={achievements.completedCount} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Celkem úspěchů" value={achievements.totalCount} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Procento dokončení"
            value={`${achievements.totalCount > 0 ? Math.round((achievements.completedCount / achievements.totalCount) * 100) : 0}%`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Achievements by Category */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <Card key={category}>
          <h2 className="text-xl font-semibold mb-4 capitalize">
            {category.toLowerCase()} úspěchy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAchievements.map((userAchievement) => (
              <div
                key={userAchievement.id}
                className={`p-4 rounded-lg border ${
                  userAchievement.isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white dark:bg-background-paper border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">{userAchievement.achievement.icon}</div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(
                      userAchievement.achievement.category
                    )}`}
                  >
                    {userAchievement.achievement.points} bodů
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg mb-1">
                  {userAchievement.achievement.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {userAchievement.achievement.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Pokrok</span>
                    <span>
                      {userAchievement.progress} / {userAchievement.achievement.targetValue}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        userAchievement.progress,
                        userAchievement.achievement.targetValue
                      )}`}
                      style={{
                        width: `${Math.min(
                          (userAchievement.progress / userAchievement.achievement.targetValue) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm font-medium ${
                      userAchievement.isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {userAchievement.isCompleted ? '✅ Dokončeno' : '⏳ Probíhá'}
                  </span>
                  
                  {userAchievement.achievement.isRepeatable && (
                    <span className="text-xs text-blue-600">
                      {userAchievement.completionCount}x dokončeno
                    </span>
                  )}
                </div>

                {userAchievement.completedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Dokončeno: {new Date(userAchievement.completedAt).toLocaleDateString('cs-CZ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {achievements.achievements.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold mb-2">Zatím žádné úspěchy</h3>
            <p className="text-gray-600">
              Začněte pít pivo a sbírejte úspěchy! Vaše pokroky se zde zobrazí.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}; 