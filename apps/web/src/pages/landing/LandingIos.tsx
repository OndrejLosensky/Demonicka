import { motion } from 'framer-motion';
import { useTranslations } from '../../contexts/LocaleContext';
import { sectionReveal } from './landingMotion';

export function LandingIos() {
  const t = useTranslations<Record<string, unknown>>('landing');
  const ios = (t.ios as Record<string, string | string[]>) || {};

  const title =
    (ios.title as string) ?? 'Spravujte události na cestách';
  const description =
    (ios.description as string) ??
    'Nativní iOS aplikace ve SwiftUI – stejné funkce jako web, optimalizované pro mobil.';
  const bullets = Array.isArray(ios.bullets) ? ios.bullets : [];

  return (
    <motion.section
      id="ios"
      {...sectionReveal}
      className="relative border-t border-gray-100 bg-white py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-700)',
              }}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              iOS
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              {description}
            </p>
            {bullets.length > 0 && (
              <ul className="mt-8 space-y-4">
                {bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-primary-500)',
                      }}
                    />
                    <span className="text-gray-700">{String(bullet)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-center">
            <div
              className="relative w-64 shrink-0 rounded-[2.25rem] border-[8px] border-gray-800 shadow-2xl md:w-72"
              style={{
                boxShadow:
                  '0 25px 50px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            >
              <div className="overflow-hidden rounded-[1.5rem] bg-white aspect-[9/19]">
                <img
                  src="/images/ios_00.png"
                  alt="Démonická iOS app"
                  loading="lazy"
                  width={288}
                  height={608}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div
                className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-md"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                <img
                  src="/icons/6.png"
                  alt=""
                  className="h-6 w-6 object-contain invert"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
