import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '../../contexts/LocaleContext';
import type { PublicStats } from '../../types/public';
import { sectionReveal } from './landingMotion';

interface StatItem {
  key: string;
  value: number | undefined;
  fallbackKey: string;
  descriptionKey: string;
}

export function LandingStatsStrip({
  stats,
  loading,
}: {
  stats: PublicStats | null;
  loading: boolean;
}) {
  const t = useTranslations<Record<string, unknown>>('landing');
  const statsT = (t.stats as Record<string, string>) || {};
  const trustedBy = statsT.trustedBy ?? 'Trusted by the community';
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const items: StatItem[] = [
    {
      key: 'eventsFinished',
      value: stats?.totalEventsFinished,
      fallbackKey: 'eventsFinishedFallback',
      descriptionKey: 'eventsFinishedDescription',
    },
    {
      key: 'totalBeers',
      value: stats?.totalBeers,
      fallbackKey: 'totalBeersFallback',
      descriptionKey: 'totalBeersDescription',
    },
    {
      key: 'activeBarrels',
      value: stats?.totalBarrels,
      fallbackKey: 'activeBarrelsFallback',
      descriptionKey: 'activeBarrelsDescription',
    },
    {
      key: 'activeParticipants',
      value: stats?.totalUsers,
      fallbackKey: 'activeParticipantsFallback',
      descriptionKey: 'activeParticipantsDescription',
    },
    {
      key: 'beerPongGames',
      value: stats?.totalBeerPongGamesPlayed,
      fallbackKey: 'beerPongFallback',
      descriptionKey: 'beerPongDescription',
    },
  ];

  return (
    <motion.section
      id="stats"
      {...sectionReveal}
      className="relative border-t border-gray-100 bg-white py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="mb-12 text-center text-sm font-semibold uppercase tracking-wider text-gray-400">
          {trustedBy}
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-10">
          {items.map((item) => {
            const isZero = item.value === 0;
            const isExpanded = expandedKey === item.key;
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setExpandedKey(item.key)}
                onMouseLeave={() => setExpandedKey(null)}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedKey(isExpanded ? null : item.key)
                  }
                  className="group w-full text-left"
                >
                  <div
                    className="text-4xl font-extrabold tracking-tight md:text-5xl"
                    style={{ color: 'var(--color-primary-600)' }}
                  >
                    {loading ? '…' : item.value ?? 0}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-600 group-hover:text-gray-900">
                    {statsT[item.key] ?? item.key}
                  </div>
                  {isZero && statsT[item.fallbackKey] && (
                    <div className="mt-1 text-xs text-gray-500">
                      {statsT[item.fallbackKey]}
                    </div>
                  )}
                </button>
                {isExpanded && statsT[item.descriptionKey] && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 top-full z-10 mt-3 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-600 shadow-xl"
                  >
                    {statsT[item.descriptionKey]}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
