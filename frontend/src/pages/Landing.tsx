import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { landingApi } from './Landing/api';
import type { PublicStats, PublicParticipant, BarrelStats } from '../types/public-stats';

const Landing = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold mb-6">🍺 Beer Stats Dashboard</h1>
          <p className="text-xl text-blue-200 mb-12">Track, analyze, and celebrate every beer moment!</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center"
          >
            <h3 className="text-4xl font-bold text-yellow-400 mb-2">{stats?.totalBeers || 0}</h3>
            <p className="text-blue-200">Total Beers Consumed</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center"
          >
            <h3 className="text-4xl font-bold text-yellow-400 mb-2">{stats?.totalParticipants || 0}</h3>
            <p className="text-blue-200">Active Participants</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center"
          >
            <h3 className="text-4xl font-bold text-yellow-400 mb-2">{stats?.totalBarrels || 0}</h3>
            <p className="text-blue-200">Active Barrels</p>
          </motion.div>
        </div>
      </section>

      {/* Barrel Visualization */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold mb-8 text-center"
        >
          Active Barrels
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats?.barrelStats.map((barrel: BarrelStats, index: number) => (
            <motion.div
              key={barrel.size}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg">🛢️ {barrel.size}L Barrel</span>
                <span className="text-2xl font-bold text-yellow-400">{barrel.count}</span>
              </div>
              <div className="w-full bg-blue-900/50 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(barrel.count / (stats?.totalBarrels || 1)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-blue-400 h-2 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Participants */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold mb-8 text-center"
        >
          Top Beer Enthusiasts
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.topParticipants.map((participant: PublicParticipant, index: number) => (
            <motion.div
              key={participant.name}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-transform"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                  {participant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{participant.name}</h3>
                  <p className="text-blue-300">{participant.beerCount} beers</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-xl text-blue-200 mb-8">Become part of our beer-loving community!</p>
          <button className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-full text-lg font-bold hover:bg-yellow-300 transition-colors">
            Get Started
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing; 