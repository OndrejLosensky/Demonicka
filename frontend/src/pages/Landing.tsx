import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { landingApi } from '../api/landing';
import type { PublicStats, ActivityEvent } from '../types/public';
import translations from '../locales/cs/landing.json';
import { FaTrophy, FaUsers, FaChartLine, FaGithub, FaDiscord, FaFire, FaBeer, FaAward, FaUserPlus, FaTwitter, FaFacebook, FaArrowRight } from 'react-icons/fa';
import { BsArrowUpRight, BsLightning } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useActiveEvent } from '../contexts/ActiveEventContext';

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

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 0, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
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
      ease: "easeOut"
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
      ease: "easeInOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
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
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeEvent } = useActiveEvent();

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
  }, [activeEvent?.id]);

  const StatsSection = () => (
    <div className="relative z-10 -mt-20 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="mx-auto max-w-7xl grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8"
      >
        <motion.div
          variants={cardVariants}
          className="transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="relative bg-white dark:bg-background-card rounded-[20px] shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-8">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-500">
                  {translations.stats.totalBeers}
                </h3>
                <div className="mt-2">
                  <p className="text-4xl font-bold text-gray-900 ">
                    {loading ? "..." : stats?.totalBeers || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="relative bg-white dark:bg-background-card rounded-[20px] shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-8">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-500">
                  {translations.stats.activeParticipants}
                </h3>
                <div className="mt-2">
                  <p className="text-4xl font-bold text-gray-900">
                    {loading ? "..." : stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="relative bg-white dark:bg-background-card rounded-[20px] shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-8">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-500">
                  {translations.stats.activeBarrels}
                </h3>
                <div className="mt-2">
                  <p className="text-4xl font-bold text-gray-900">
                    {loading ? "..." : stats?.totalBarrels || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

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
      <div className="relative pt-16"> {/* Added pt-16 to account for fixed header */}
        {/* Hero Section */}
        <div className="pt-24 pb-32 sm:pt-32 sm:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, type: "spring", bounce: 0.4 }}
                className="relative inline-block"
              >
                {/* Decorative Elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary-600/20 rounded-full blur-xl opacity-70" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-600 rounded-full opacity-50 animate-pulse" />
                
                <motion.div
                  variants={floatingAnimation}
                  initial="initial"
                  animate="animate"
                  className="relative"
                >
                  <img
                    src="/logo.svg"
                    alt="Démonická"
                    className="mx-auto h-40 w-auto mb-8 drop-shadow-2xl relative z-10"
                  />
                  
                  {/* Decorative Icons */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-12 -top-12 text-primary/30"
                  >
                    <FaFire size={40} />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -left-10 -bottom-10 text-primary/30"
                  >
                    <BsLightning size={30} />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                  className="absolute -right-4 -top-4 bg-primary text-white rounded-full px-4 py-2 text-sm font-semibold transform rotate-12 shadow-lg"
                >
                  v2.0
                </motion.div>
              </motion.div>

              <motion.div
                variants={heroTextVariants}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                <motion.h1
                  className="text-6xl font-bold tracking-tight sm:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-600 to-primary relative z-10"
                  style={{ textShadow: '0 0 40px rgba(255,59,48,0.3)' }}
                >
                  {translations.hero.title}
                </motion.h1>
                
                <motion.p
                  className="mt-8 text-xl leading-8 text-text-secondary relative z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {translations.hero.subtitle}
                </motion.p>

                {/* Enhanced CTA Buttons */}
                <motion.div
                  className="mt-10 flex items-center justify-center gap-x-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <Link
                    to="/register"
                    className="relative group"
                  >
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary to-primary-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
                    <button className="relative rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg group-hover:bg-primary-600 transition-all duration-300">
                      <span className="flex items-center gap-2">
                        {translations.hero.getStarted}
                        <BsArrowUpRight className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </span>
                    </button>
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="group text-lg font-semibold leading-6 text-text-primary hover:text-primary transition-colors duration-300 flex items-center gap-2"
                  >
                    {translations.hero.learnMore}
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mt-40 max-w-7xl px-6 lg:px-8"
        >
          {/* Fun Icons Grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-8 mb-20">
            {[1, 2, 3, 5, 6, 7, 8, 9, 10].map((num) => (
              <motion.div
                key={num}
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: num * 0.1 
                }}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 10,
                  transition: { duration: 0.2 }
                }}
                className="aspect-square flex items-center justify-center p-4"
              >
                <img
                  src={`/icons/${num}.png`}
                  alt={`Fun icon ${num}`}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            ))}
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-primary via-primary-600 to-primary bg-clip-text text-transparent"
            >
              {translations.features.title}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="mt-6 text-lg leading-8 text-gray-600"
            >
              {translations.features.description}
            </motion.p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mx-auto mt-16 max-w-5xl grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {translations.features.list.items.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-primary-600/20 to-primary/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300" />
                <div className="relative bg-white dark:bg-background-card rounded-2xl p-8 shadow-lg ring-1 ring-black/5 hover:ring-primary/20 transition-all duration-300">
                  <div className="flex items-center gap-x-4">
                    {/* Feature Icons */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      {index === 0 ? <FaChartLine className="h-6 w-6 text-primary" /> :
                       index === 1 ? <FaTrophy className="h-6 w-6 text-primary" /> :
                       index === 2 ? <FaUsers className="h-6 w-6 text-primary" /> :
                       index === 3 ? <FaFire className="h-6 w-6 text-primary" /> :
                       index === 4 ? <BsLightning className="h-6 w-6 text-primary" /> :
                       <FaChartLine className="h-6 w-6 text-primary" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                      {feature}
                    </h3>
                  </div>
                  {/* Decorative line */}
                  <div className="mt-4 h-0.5 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary-600 transition-colors duration-300 group"
            >
              {translations.cta.button}
              <BsArrowUpRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
        </motion.div>

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

        {/* Top Participants Section */}
        {stats?.topUsers && stats.topUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto mt-20 max-w-2xl rounded-3xl bg-white dark:bg-background-card ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden shadow-xl"
          >
            <div className="p-8">
              <ul role="list" className="space-y-8">
                {stats.topUsers.map((participant, index) => (
                  <motion.li
                    key={participant.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-center gap-6"
                  >
                    {/* Rank Circle */}
                    <div className={`
                      flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold
                      ${index === 0 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
                    `}>
                      {index + 1}
                    </div>

                    {/* Participant Info */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {participant.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FaBeer className="text-primary" />
                        {participant.beerCount} {translations.topParticipants.beers}
                      </p>
                    </div>

                    {/* Leader Badge */}
                    {index === 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: 0.5
                        }}
                        className="absolute -top-1 -right-1 flex items-center gap-1 bg-primary text-white text-sm px-3 py-1 rounded-full shadow-lg"
                      >
                        👑 Leader
                      </motion.div>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-32 border-t border-primary/10 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              {/* Logo and Description */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <Link to="/" className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">Démonická</span>
                    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">v2.0</span>
                  </Link>
                  <p className="text-sm text-text-secondary max-w-md">
                    Sledujte svou pivní cestu s přáteli a staňte se součástí naší rostoucí komunity pivních nadšenců.
                  </p>
                  {/* Newsletter Subscription */}
                  <div className="max-w-sm space-y-4">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {translations.footer.newsletter.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {translations.footer.newsletter.description}
                    </p>
                    <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                      <input
                        type="email"
                        placeholder={translations.footer.newsletter.placeholder}
                        className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-text-primary ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        {translations.footer.newsletter.button}
                        <FaArrowRight className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              </div>

              {/* Footer Sections */}
              <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-4">
                {Object.entries(translations.footer.sections).map(([key, section]) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-sm font-semibold text-text-primary">
                      {section.title}
                    </h3>
                    <ul role="list" className="mt-6 space-y-4">
                      {Object.entries(section.items).map(([itemKey, itemText]) => (
                        <li key={itemKey}>
                          <Link
                            to={`/${key}/${itemKey}`}
                            className="text-sm text-text-secondary hover:text-primary transition-colors duration-200"
                          >
                            {itemText}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 border-t border-primary/10 pt-8">
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <p className="text-sm text-text-secondary">
                  &copy; {new Date().getFullYear()} Démonická. {translations.footer.allRightsReserved}
                </p>
                <div className="flex space-x-6">
                  {[
                    { icon: FaGithub, href: "https://github.com/your-repo" },
                    { icon: FaDiscord, href: "https://discord.gg/your-server" },
                    { icon: FaTwitter, href: "https://twitter.com/your-handle" },
                    { icon: FaFacebook, href: "https://facebook.com/your-page" }
                  ].map((social, index) => (
                    <motion.a
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      href={social.href}
                      className="text-text-secondary hover:text-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="sr-only">{social.icon.name}</span>
                      <social.icon className="h-6 w-6" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 