import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslations } from '../../contexts/LocaleContext';
import { VersionChip } from './VersionChip';
import { fadeInUp, fadeIn } from './landingMotion';

const LANDING_ICONS = [1, 2, 3, 5, 6, 7] as const;

export function LandingHero() {
  const t = useTranslations<Record<string, unknown>>('landing');
  const hero = (t.hero as Record<string, string>) || {};

  return (
    <section
      id="features"
      className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-white via-[var(--color-primary-50)]/30 to-gray-50/80 px-4 pt-20 pb-24 md:pt-28 md:pb-32"
    >
      {/* Soft background shapes */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--color-primary-200)' }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-72 w-[500px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--color-primary-100)' }}
        />
      </div>

      {/* Decorative icons - subtle floating */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {LANDING_ICONS.slice(0, 5).map((num, i) => (
          <motion.div
            key={num}
            className="absolute h-10 w-10 opacity-15 md:h-12 md:w-12 md:opacity-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${18 + (i % 3) * 24}%`,
            }}
          >
            <img
              src={`/icons/${num}.png`}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: Copy + CTAs */}
        <div className="max-w-xl">
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <VersionChip />
          </motion.div>
          <motion.h1
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
          >
            {hero.title ?? 'Démonická'}
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-5 text-lg text-gray-600 md:text-xl"
          >
            {hero.subtitle ?? 'Sledujte svou pivní cestu s přáteli'}
          </motion.p>
          <motion.div
            {...fadeIn}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:opacity-95 hover:shadow-xl"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              {hero.register ?? 'Registrace'}
              <span className="text-lg" aria-hidden>→</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              {hero.login ?? 'Přihlášení'}
            </Link>
          </motion.div>
        </div>

        {/* Right: Mobile mockup (priority visual) */}
        <motion.div
          {...fadeIn}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="relative">
            {/* Phone frame */}
            <div
              className="relative w-[280px] shrink-0 rounded-[2.5rem] border-[10px] border-gray-800 shadow-2xl md:w-[320px]"
              style={{
                boxShadow:
                  '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              <div className="overflow-hidden rounded-[1.75rem] bg-white aspect-[9/19]">
                <img
                  src="/images/ios_00.png"
                  alt="Démonická app"
                  className="h-full w-full object-cover object-top"
                  width={320}
                  height={680}
                />
              </div>
            </div>
            {/* Floating accent icon */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg md:-right-6 md:-top-6 md:h-16 md:w-16"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              <img
                src="/icons/1.png"
                alt=""
                className="h-7 w-7 object-contain invert md:h-9 md:w-9"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
