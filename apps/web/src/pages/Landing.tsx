import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { landingApi } from '../api/landing';
import type { PublicStats, ActivityEvent } from '../types/public';
import translations from '../locales/cs/landing.json';
import { FaTrophy, FaUsers, FaChartLine, FaBeer, FaAward, FaUserPlus } from 'react-icons/fa';
import { BsArrowUpRight, BsLightning } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import type { LeaderboardData } from '../pages/Leaderboard/types';
import { dashboardService } from '../services/dashboardService';
import { usePageTitle } from '../hooks/usePageTitle';
import { websocketService } from '../services/websocketService';

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};



const heroTextVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96] as const
    }
  }
};

const heroImageVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.43, 0.13, 0.23, 0.96] as const
    }
  }
};

const heroStatsVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96] as const
    }
  }
};

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    scale: [1, 1.2, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1] as const
    }
  }
};



const getEventIcon = (type: ActivityEvent['type']) => {
  switch (type) {
    case 'beer_added':
      return <FaBeer className="h-6 w-6 text-primary" />;
    case 'barrel_finished':
      return <FaTrophy className="h-6 w-6 text-primary" />;
    case 'achievement_unlocked':
      return <FaAward className="h-6 w-6 text-primary" />;
    case 'new_user':
      return <FaUserPlus className="h-6 w-6 text-primary" />;
  }
};

const getEventText = (event: ActivityEvent) => {
  switch (event.type) {
    case 'beer_added':
      return translations.latestActivity.events.beer_added.replace('{count}', event.details.beerCount?.toString() || '0');
    case 'barrel_finished':
      return translations.latestActivity.events.barrel_finished.replace('{name}', event.details.barrelName || '');
    case 'achievement_unlocked':
      return translations.latestActivity.events.achievement_unlocked.replace('{name}', event.details.achievementName || '');
    case 'new_user':
      return translations.latestActivity.events.new_participant;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  const distance = formatDistanceToNow(date, { locale: cs, addSuffix: true });
  return distance;
};

export default function Landing() {
  usePageTitle();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeEvent, isActiveEventLoading } = useActiveEvent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await landingApi.getStats(activeEvent?.id);
        console.log('Fetched stats:', data);
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeEvent?.id, isActiveEventLoading]);

  // Compute corrected total beers from current event participants (excludes removed users)
  const correctedTotalBeers = (leaderboard?.males || leaderboard?.females)
    ? ((leaderboard?.males ?? []).reduce((s, u) => s + (u.beerCount || 0), 0) +
       (leaderboard?.females ?? []).reduce((s, u) => s + (u.beerCount || 0), 0))
    : undefined;

  // Load public leaderboard preview (global or for active event if available)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const data = await dashboardService.getLeaderboard(activeEvent?.id);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard preview:', error);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeEvent?.id, isActiveEventLoading]);

  // Subscribe to real-time WebSocket updates
  useEffect(() => {
    if (!activeEvent?.id) return;

    // Join the event room for real-time updates
    websocketService.joinEvent(activeEvent.id);

    // Subscribe to real-time updates
    const onLeaderboardUpdate = (data: LeaderboardData) => {
      setLeaderboard(data);
    };

    const onDashboardStatsUpdate = (data: { dashboard: unknown; public: PublicStats }) => {
      console.log('Real-time dashboard stats update received on Landing:', data);
      setStats(data.public);
    };

    websocketService.subscribe('leaderboard:update', onLeaderboardUpdate);
    websocketService.subscribe('dashboard:stats:update', onDashboardStatsUpdate);

    return () => {
      websocketService.unsubscribe('leaderboard:update', onLeaderboardUpdate);
      websocketService.unsubscribe('dashboard:stats:update', onDashboardStatsUpdate);
      websocketService.leaveEvent(activeEvent.id);
    };
  }, [activeEvent?.id]);

  // Fallback refresh every 5 minutes in case WebSocket fails
  useEffect(() => {
    if (!activeEvent?.id) return;

    console.log('Landing: Setting up 5-minute fallback refresh interval');
    const interval = setInterval(async () => {
      console.log('Landing: 5-minute fallback refresh triggered');
      
      try {
        // Refresh both stats and leaderboard
        const [statsData, leaderboardData] = await Promise.all([
          landingApi.getStats(activeEvent.id),
          dashboardService.getLeaderboard(activeEvent.id)
        ]);
        
        setStats(statsData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Landing: Fallback refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log('Landing: Clearing 5-minute fallback refresh interval');
      clearInterval(interval);
    };
  }, [activeEvent?.id]);


  return (
    <div className="relative min-h-screen bg-background-primary dark:bg-background-primary transition-colors duration-200">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-background-secondary to-background-primary dark:from-background-primary dark:via-background-secondary dark:to-background-primary opacity-50" />
        
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
            style={{
              backgroundImage: 'url("/beer-pattern.svg")',
              backgroundSize: '50px',
              backgroundRepeat: 'repeat',
              filter: 'blur(1px)',
            }}
          />
          
          {/* Glowing Orbs */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`glow-${i}`}
              variants={glowAnimation}
              initial="initial"
              animate="animate"
              className="absolute rounded-full bg-primary/20 blur-2xl"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                left: `${20 + i * 30}%`,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Floating Beer Bubbles with Enhanced Style */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "100%", x: `${10 + i * 10}%`, scale: 0.5, opacity: 0.3 }}
              animate={{ 
                y: "-100%",
                opacity: [0.3, 0.6, 0.3],
                transition: {
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 1.5
                }
              }}
              className="absolute w-4 h-4 rounded-full bg-primary/30 backdrop-blur-sm"
              style={{
                boxShadow: '0 0 20px rgba(255,59,48,0.3)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden min-h-screen bg-gray-50">
          {/* Hero Background - Clean and Modern */}
          <div className="absolute inset-0">
            {/* Clean gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
            
            {/* Subtle animated accents */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1.2, 1, 1.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            />
          </div>

          {/* Hero Content */}
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="pt-32 pb-20 sm:pt-40 sm:pb-28">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Column - Text Content */}
                <motion.div
                  variants={heroTextVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-center lg:text-left"
                >
                  {/* Version Badge - Small Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6"
                  >
                    <BsLightning className="w-3 h-3" />
                    <span>Verze 2.0 je tady!</span>
                  </motion.div>

                  {/* Main Title - Fixed and More Prominent */}
                  <motion.h1
                    className="text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-primary-600">
                      {translations.hero.title}
                    </span>
                  </motion.h1>

                  {/* Subtitle */}
                  <motion.p
                    className="mt-6 text-xl leading-relaxed text-gray-600 max-w-xl mx-auto lg:mx-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    {translations.hero.subtitle}
                  </motion.p>

                  {/* Dynamic Stats - Improved Cards */}
                  <motion.div
                    variants={heroStatsVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-12 grid grid-cols-3 gap-4 max-w-lg"
                  >
                    <motion.div 
                      className="flex flex-col items-center lg:items-start p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                      whileHover={{ y: -2 }}
                    >
                      <div className="text-3xl lg:text-4xl font-black text-primary">
                        {loading ? "..." : (correctedTotalBeers ?? stats?.totalBeers ?? 0)}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-500 text-center lg:text-left">
                        {translations.stats.totalBeers}
                      </div>
                    </motion.div>
                    <motion.div 
                      className="flex flex-col items-center lg:items-start p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                      whileHover={{ y: -2 }}
                    >
                      <div className="text-3xl lg:text-4xl font-black text-primary">
                        {loading ? "..." : stats?.totalUsers || 0}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-500 text-center lg:text-left">
                        {translations.stats.activeParticipants}
                      </div>
                    </motion.div>
                    <motion.div 
                      className="flex flex-col items-center lg:items-start p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                      whileHover={{ y: -2 }}
                    >
                      <div className="text-3xl lg:text-4xl font-black text-primary">
                        {loading ? "..." : stats?.totalBarrels || 0}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-500 text-center lg:text-left">
                        {translations.stats.activeBarrels}
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* CTA Buttons */}
                  <motion.div
                    className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <Link
                      to="/register"
                      className="group relative inline-flex items-center"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
                      <button className="relative rounded-full bg-primary px-8 py-3 text-lg font-semibold text-white shadow-lg group-hover:bg-primary-600 transition-all duration-300 w-full sm:w-auto">
                        <span className="flex items-center gap-2 justify-center">
                          {translations.hero.getStarted}
                          <BsArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </span>
                      </button>
                    </Link>
                    <Link
                      to="/leaderboard"
                      className="group text-lg font-semibold text-gray-600 hover:text-primary transition-colors duration-300 flex items-center gap-2"
                    >
                      {translations.hero.learnMore}
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Right Column - Visual Content */}
                <motion.div
                  variants={heroImageVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative flex justify-center items-center"
                >
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-2xl"
                    />
                  </div>

                  {/* Main Logo with subtle animation */}
                  <motion.div
                    className="relative"
                    animate={{
                      y: [-15, 15, -15],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <img
                      src="/logo.svg"
                      alt="Démonická"
                      className="w-[500px] h-[500px] object-contain"
                      style={{
                        filter: 'drop-shadow(0 0 20px rgba(255,59,48,0.2))'
                      }}
                    />

                    {/* Floating Icons */}
                    {[1, 2, 3, 5, 6].map((num, index) => (
                      <motion.div
                        key={num}
                        className="absolute"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 }}
                        style={{
                          top: `${15 + index * 18}%`,
                          left: `${5 + index * 22}%`,
                          zIndex: index,
                        }}
                      >
                        <motion.div
                          animate={{
                            y: [-8, 8, -8],
                            rotate: [-8, 8, -8],
                          }}
                          transition={{
                            duration: 4 + index,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3,
                          }}
                        >
                          <img
                            src={`/icons/${num}.png`}
                            alt={`Icon ${num}`}
                            className="w-16 h-16 object-contain"
                            style={{
                              filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))'
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Enhanced with Screenshots */}
        <section className="relative py-32 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Section Header */}
            <div className="mx-auto max-w-3xl text-center mb-20">
              <motion.h2
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="text-4xl lg:text-5xl font-black tracking-tight text-gray-900 mb-6"
              >
                Poznávejte naši platformu
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="text-xl text-gray-600 leading-relaxed"
              >
                Kompletní systém pro správu pivních událostí s intuitivním rozhraním a pokročilými funkcemi
              </motion.p>
            </div>

            {/* Features Grid */}
            <div className="space-y-32">
              {/* Feature 1 - Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                <div className="order-2 lg:order-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                    <FaChartLine className="w-4 h-4" />
                    Dashboard & Analytics
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    Komplexní přehled v reálném čase
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Sledujte všechny klíčové metriky na jednom místě. Interaktivní grafy, statistiky účastníků a přehled aktivity vám poskytnou kompletní obraz o vašich událostech.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Interaktivní grafy a statistiky</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Real-time aktualizace dat</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Přehled aktivních sudů</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-white dark:bg-background-paper rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      {/* Dashboard Screenshot */}
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src="/images/dashboard_00.png" 
                          alt="Dashboard Screenshot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Feature 2 - User Management */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                <div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-white dark:bg-background-paper rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      {/* User Management Screenshot */}
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src="/images/participants_00.png" 
                          alt="User Management Screenshot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                    <FaUsers className="w-4 h-4" />
                    Správa uživatelů
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    Efektivní správa účastníků
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Spravujte uživatele a jejich oprávnění s lehkostí. Přidávejte nové účastníky, sledujte jejich aktivitu a spravujte role jednoduše a intuitivně.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Správa rolí a oprávnění</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Rychlé přidávání účastníků</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Sledování aktivity uživatelů</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Feature 3 - Barrel Management */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                <div className="order-2 lg:order-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                    <FaBeer className="w-4 h-4" />
                    Správa sudů
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    Pokročilá správa pivních sudů
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Sledujte stav všech sudů, jejich obsah a spotřebu v reálném čase. Dostávejte upozornění na dokončené sudy a plánujte dopředu.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Real-time monitoring sudů</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Automatické upozornění</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Historie spotřeby</span>
                    </li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-white dark:bg-background-paper rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      {/* Barrel Management Screenshot */}
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src="/images/barrels_00.png" 
                          alt="Barrel Management Screenshot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Feature 4 - Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                <div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-white dark:bg-background-paper rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      {/* Leaderboard Screenshot */}
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src="/images/leaderboard_00.png" 
                          alt="Leaderboard Screenshot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                    <FaTrophy className="w-4 h-4" />
                    Žebříček & Soutěže
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    Motivace prostřednictvím soutěžení
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Vytvářejte zdravou konkurenci mezi účastníky. Žebříčky, achievementy a statistiky motivují k aktivní účasti a vytváří skvělou atmosféru.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Real-time žebříčky</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Systém achievementů</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-gray-700">Detailní statistiky</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>


          </div>
        </section>

        {/* Public Leaderboard Preview */}
        <section className="relative py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              <div className="lg:col-span-1">
                <motion.h2
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="text-4xl font-black tracking-tight text-gray-900 mb-4"
                >
                  Žebříček
                </motion.h2>
                <p className="text-lg text-gray-600 mb-6">
                  Podívejte se na aktuální pořadí. Žebříček je veřejně dostupný – můžete se kdykoli podívat, jak si vedou účastníci.
                </p>
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-600 transition-colors duration-300 group shadow-md"
                >
                  Otevřít žebříček
                  <BsArrowUpRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-background-paper rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Men */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FaBeer className="text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">Muži</h3>
                      </div>
                      <div className="space-y-2">
                        {leaderboardLoading ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-background-paper rounded-xl border border-gray-200/80 dark:border-gray-800 px-4 py-2.5 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 ring-1 ring-gray-200/60 flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</div>
                                <div className="h-4 w-32 bg-gray-100 rounded" />
                              </div>
                              <div className="h-4 w-12 bg-gray-100 rounded" />
                            </div>
                          ))
                        ) : (
                          (leaderboard?.males ?? []).slice(0, 5).map((item) => {
                            const rankBg = item.rank === 1
                              ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 ring-yellow-400/50'
                              : item.rank === 2
                              ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 ring-gray-300/60'
                              : item.rank === 3
                              ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 ring-amber-300/60'
                              : 'bg-gray-100 text-gray-600 ring-gray-200/60';
                            return (
                              <div key={item.id} className="flex items-center justify-between bg-white dark:bg-background-paper rounded-xl border border-gray-200/80 dark:border-gray-800 px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ring-1 flex items-center justify-center text-xs font-bold ${rankBg}`}>{item.rank}</div>
                                  <div className="text-gray-800 font-medium">{item.username}</div>
                                </div>
                                <div className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                                  <FaBeer className="text-primary/80" />
                                  <span className="font-semibold">{item.beerCount}</span>
                                  <span className="text-gray-500">piv</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    {/* Women */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FaTrophy className="text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">Ženy</h3>
                      </div>
                      <div className="space-y-2">
                        {leaderboardLoading ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-background-paper rounded-xl border border-gray-200/80 dark:border-gray-800 px-4 py-2.5 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 ring-1 ring-gray-200/60 flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</div>
                                <div className="h-4 w-32 bg-gray-100 rounded" />
                              </div>
                              <div className="h-4 w-12 bg-gray-100 rounded" />
                            </div>
                          ))
                        ) : (
                          (leaderboard?.females ?? []).slice(0, 5).map((item) => {
                            const rankBg = item.rank === 1
                              ? 'bg-gradient-to-br from-pink-200 to-pink-400 text-pink-900 ring-pink-300/60'
                              : item.rank === 2
                              ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 ring-gray-300/60'
                              : item.rank === 3
                              ? 'bg-gradient-to-br from-rose-200 to-rose-400 text-rose-900 ring-rose-300/60'
                              : 'bg-gray-100 text-gray-600 ring-gray-200/60';
                            return (
                              <div key={item.id} className="flex items-center justify-between bg-white dark:bg-background-paper rounded-xl border border-gray-200/80 dark:border-gray-800 px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ring-1 flex items-center justify-center text-xs font-bold ${rankBg}`}>{item.rank}</div>
                                  <div className="text-gray-800 font-medium">{item.username}</div>
                                </div>
                                <div className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                                  <FaBeer className="text-primary/80" />
                                  <span className="font-semibold">{item.beerCount}</span>
                                  <span className="text-gray-500">piv</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Swift Mobile App Section */}
        <section className="relative py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - App Info */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  iOS aplikace
                </div>
                
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-gray-900 mb-6">
                  Spravujte události <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-600">na cestách</span>
                </h2>
                
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Nativní iOS aplikace postavená ve SwiftUI poskytuje stejné funkce jako webová verze, optimalizované pro mobilní zařízení.
                </p>

                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Nativní SwiftUI aplikace</h3>
                      <p className="text-gray-600">Moderní iOS aplikace s plynulými animacemi a intuitivním ovládáním</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Správa na cestách</h3>
                      <p className="text-gray-600">Přidávejte piva, spravujte sudy a sledujte statistiky kdekoli</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Real-time synchronizace</h3>
                      <p className="text-gray-600">Okamžitá synchronizace s webovou aplikací a ostatními zařízeními</p>
                    </div>
                  </div>
                </div>


              </motion.div>

              {/* Right Column - App Screenshots/Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2 flex justify-center"
              >
                <div className="relative">
                  {/* Phone Mockup */}
                  <div className="relative mx-auto w-72 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
                    <div className="w-full h-full bg-white dark:bg-background-paper rounded-[2.5rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gray-100 flex items-center justify-center">
                        <div className="w-32 h-6 bg-black rounded-full"></div>
                      </div>
                      
                      {/* iOS App Screenshot */}
                      <div className="pt-12 h-full overflow-hidden">
                        <img 
                          src="/images/ios_00.png" 
                          alt="iOS App Screenshot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    animate={{
                      y: [-10, 10, -10],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center"
                  >
                    <FaBeer className="w-8 h-8 text-primary" />
                  </motion.div>
                  
                  <motion.div
                    animate={{
                      y: [10, -10, 10],
                      rotate: [0, -5, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center"
                  >
                    <FaTrophy className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Latest Activity Section */}
        {stats?.latestActivity && stats.latestActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto mt-32 max-w-2xl px-6 lg:px-8"
          >
            <div className="text-center mb-12">
              <motion.h2
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-primary via-primary-600 to-primary bg-clip-text text-transparent"
              >
                {translations.latestActivity.title}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="mt-4 text-lg leading-8 text-gray-600"
              >
                {translations.latestActivity.subtitle}
              </motion.p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {stats.latestActivity.map((event) => (
                <motion.div
                  key={event.id}
                  variants={fadeInUp}
                  whileHover={{ x: 10 }}
                  className="relative group"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-primary-600/20 to-primary/20 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-white dark:bg-background-card rounded-xl p-4 shadow-lg ring-1 ring-black/5 hover:ring-primary/20 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {event.userName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getEventText(event)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-32 border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="text-center">
              {/* Logo and Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <Link to="/" className="inline-flex items-center space-x-2">
                  <span className="text-2xl font-bold text-primary">Démonická</span>
                  <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">v2.0</span>
                </Link>
                <p className="text-gray-600 max-w-md mx-auto">
                  Sledujte svou pivní cestu s přáteli a staňte se součástí naší rostoucí komunity pivních nadšenců.
                </p>
              </motion.div>

              {/* Simple Links */}
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-sm text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Žebříček
                </Link>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Přihlášení
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  Registrace
                </Link>
              </div>

              {/* Copyright */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} Démonická. Všechna práva vyhrazena.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 