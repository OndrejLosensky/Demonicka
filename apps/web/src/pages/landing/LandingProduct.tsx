import { motion } from 'framer-motion';
import { useTranslations } from '../../contexts/LocaleContext';
import { sectionReveal } from './landingMotion';

const features = [
  { id: 'dashboard', image: '/images/dashboard_00.png', iconNum: 2 },
  { id: 'participants', image: '/images/participants_00.png', iconNum: 3 },
  { id: 'barrels', image: '/images/barrels_00.png', iconNum: 5 },
  { id: 'leaderboard', image: '/images/leaderboard_00.png', iconNum: 6 },
] as const;

export function LandingProduct() {
  const t = useTranslations<Record<string, unknown>>('landing');
  const product =
    (t.product as Record<string, Record<string, string> | string> | undefined) ??
    {};
  const sectionTitle =
    typeof product.sectionTitle === 'string'
      ? product.sectionTitle
      : 'Jak to vypadá uvnitř';
  const sectionSubtitle =
    typeof product.sectionSubtitle === 'string'
      ? product.sectionSubtitle
      : 'Kompletní systém pro správu pivních událostí';

  const getTitle = (key: string) => {
    const obj = product[key];
    return obj &&
      typeof obj === 'object' &&
      'title' in obj
      ? (obj as Record<string, string>).title
      : key;
  };
  const getDesc = (key: string) => {
    const obj = product[key];
    return obj &&
      typeof obj === 'object' &&
      'description' in obj
      ? (obj as Record<string, string>).description
      : '';
  };

  return (
    <motion.section
      id="product"
      {...sectionReveal}
      className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl lg:text-[2.75rem]">
            {sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {sectionSubtitle}
          </p>
        </div>

        <div className="space-y-28">
          {features.map((feat, idx) => {
            const title = getTitle(feat.id);
            const desc = getDesc(feat.id);
            const isEven = idx % 2 === 0;
            return (
              <motion.div
                key={feat.id}
                {...sectionReveal}
                className={`grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-20 ${
                  !isEven ? 'md:grid-flow-dense' : ''
                }`}
              >
                <div
                  className={`relative ${
                    !isEven ? 'md:col-start-2' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 ring-1 ring-black/5">
                      <img
                        src={feat.image}
                        alt=""
                        loading="lazy"
                        width={720}
                        height={405}
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                    {/* Decorative icon */}
                    <div
                      className="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white shadow-lg md:-right-6 md:-bottom-6 md:h-16 md:w-16"
                      style={{
                        backgroundColor: 'var(--color-primary-50)',
                        borderColor: 'var(--color-primary-100)',
                      }}
                    >
                      <img
                        src={`/icons/${feat.iconNum}.png`}
                        alt=""
                        className="h-7 w-7 object-contain md:h-8 md:w-8"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display =
                            'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className={!isEven ? 'md:col-start-1 md:row-start-1' : ''}>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-primary-50)',
                      color: 'var(--color-primary-700)',
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-primary-500)',
                      }}
                    />
                    {title}
                  </div>
                  <p className="mt-4 text-lg leading-relaxed text-gray-600">
                    {desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
