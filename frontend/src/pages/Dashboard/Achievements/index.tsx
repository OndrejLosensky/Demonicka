import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../hooks/useToast';
import { achievementsService } from '../../../services/achievementsService';
import { usePageTitle } from '../../../hooks/usePageTitle';
import type { UserAchievementsResponse, UserAchievement } from '../../../types/achievements';
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

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'BEGINNER':
      return '🌱';
    case 'INTERMEDIATE':
      return '⭐';
    case 'ADVANCED':
      return '🚀';
    case 'EXPERT':
      return '👑';
    case 'LEGENDARY':
      return '🏆';
    default:
      return '🎖️';
  }
};

const getProgressColor = (progress: number) => {
  if (progress === 100) return 'bg-green-500';
  if (progress >= 75) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-gray-300';
};

export const AchievementsPage: React.FC = () => {
  usePageTitle('Úspěchy');
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: UserAchievementsResponse = await achievementsService.getUserAchievements();
      setAchievements(response.achievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      showToast('Nepodařilo se načíst úspěchy', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  const totalAchievements = achievements.length;
  const unlockedCount = unlockedAchievements.length;
  const completionRate = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, UserAchievement[]>);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Úspěchy" />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítání úspěchů...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Úspěchy" />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Celkem úspěchů"
          value={totalAchievements}
          icon="🎖️"
          color="primary"
        />
        <MetricCard
          title="Odemčeno"
          value={unlockedCount}
          icon="🏆"
          color="success"
        />
        <MetricCard
          title="Dokončení"
          value={`${completionRate}%`}
          icon="📊"
          color="info"
        />
      </div>

      {/* Progress Bar */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Celkový pokrok</h3>
            <span className="text-sm text-gray-600">{unlockedCount}/{totalAchievements}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(completionRate)}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {completionRate}% úspěchů dokončeno
          </p>
        </div>
      </Card>

      {/* Achievements by Category */}
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
        <Card key={category} className="mb-8">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{getCategoryIcon(category)}</span>
              <h2 className="text-2xl font-bold text-gray-900">
                {category.charAt(0) + category.slice(1).toLowerCase()}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(category)}`}>
                {categoryAchievements.filter(a => a.unlocked).length}/{categoryAchievements.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-white border-green-200 shadow-md hover:shadow-lg'
                      : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {achievement.unlocked ? achievement.icon : '🔒'}
                      </span>
                      <div>
                        <h3 className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    {achievement.unlocked && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Odemčeno
                      </span>
                    )}
                  </div>

                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Pokrok</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Odemčeno: {new Date(achievement.unlockedAt).toLocaleDateString('cs-CZ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {/* Empty State */}
      {achievements.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🎖️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Žádné úspěchy
            </h3>
            <p className="text-gray-600 mb-4">
              Zatím nemáte žádné úspěchy. Začněte používat aplikaci a odemkněte své první úspěchy!
            </p>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.href = '/dashboard'}
            >
              Jít na Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
