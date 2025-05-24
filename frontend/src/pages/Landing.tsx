import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { landingApi } from '../api/landing';
import type { PublicStats } from '../types/public';
import translations from '../locales/cs/landing.json';

export default function Landing() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await landingApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen bg-background-primary dark:bg-background-primary transition-colors duration-200">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-primary to-background-secondary dark:from-background-primary dark:to-background-secondary opacity-50" />

      {/* Content */}
      <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.img
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              src="/logo.svg"
              alt="Démonická"
              className="mx-auto h-24 w-auto mb-8"
            />

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl"
            >
              {translations.hero.title}
            </motion.h1>
        
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-6 text-lg leading-8 text-text-secondary"
            >
              {translations.hero.subtitle}
            </motion.p>

            {/* Stats Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3"
            >
              <div className="bg-background-card dark:bg-background-tertiary rounded-lg p-8 shadow-lg ring-1 ring-primary/5">
                <dt className="text-text-secondary text-sm font-medium">{translations.stats.totalBeers}</dt>
                <dd className="mt-2 text-4xl font-bold tracking-tight text-primary">
                  {loading ? '...' : stats?.totalBeers || 0}
                </dd>
              </div>
              <div className="bg-background-card dark:bg-background-tertiary rounded-lg p-8 shadow-lg ring-1 ring-primary/5">
                <dt className="text-text-secondary text-sm font-medium">{translations.stats.activeParticipants}</dt>
                <dd className="mt-2 text-4xl font-bold tracking-tight text-primary">
                  {loading ? '...' : stats?.totalParticipants || 0}
                </dd>
              </div>
              <div className="bg-background-card dark:bg-background-tertiary rounded-lg p-8 shadow-lg ring-1 ring-primary/5">
                <dt className="text-text-secondary text-sm font-medium">{translations.stats.activeBarrels}</dt>
                <dd className="mt-2 text-4xl font-bold tracking-tight text-primary">
                  {loading ? '...' : stats?.totalBarrels || 0}
                </dd>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link
                to="/register"
                className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {translations.hero.getStarted}
              </Link>
              <Link
                to="/leaderboard"
                className="text-lg font-semibold leading-6 text-text-primary hover:text-text-secondary"
              >
                {translations.hero.learnMore} <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Features section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
            >
              {translations.features.title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-6 text-lg leading-8 text-text-secondary"
            >
              {translations.features.description}
            </motion.p>
          </div>

          {/* Top Participants */}
          {stats?.topParticipants && stats.topParticipants.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mx-auto mt-16 max-w-2xl rounded-3xl bg-background-card dark:bg-background-tertiary ring-1 ring-primary/10 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none"
            >
              <div className="p-8 sm:p-10 lg:flex-auto">
                <h3 className="text-2xl font-bold tracking-tight text-text-primary">{translations.topParticipants.title}</h3>
                <div className="mt-6 text-base leading-7 text-text-secondary">
                  <ul role="list" className="mt-8 space-y-4">
                    {stats.topParticipants.map((participant, index) => (
                      <li key={participant.name} className="flex items-center gap-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-text-primary font-semibold">{participant.name}</div>
                          <div className="text-text-secondary">{participant.beerCount} {translations.topParticipants.beers}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Features list */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="mx-auto mt-16 max-w-2xl rounded-3xl bg-background-card dark:bg-background-tertiary ring-1 ring-primary/10 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none"
          >
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-text-primary">{translations.features.list.title}</h3>
              <div className="mt-6 text-base leading-7 text-text-secondary">
                <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 sm:grid-cols-2">
                  {translations.features.list.items.map((feature) => (
                    <li key={feature} className="flex gap-x-3 text-text-secondary">
                      <svg className="h-6 w-5 flex-none text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 