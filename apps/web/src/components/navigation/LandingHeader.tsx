import { Link } from 'react-router-dom';
import { useTranslations } from '../../contexts/LocaleContext';

const anchorLinks = [
  { id: 'features', key: 'features' },
  { id: 'product', key: 'product' },
  { id: 'stats', key: 'stats' },
  { id: 'ios', key: 'ios' },
] as const;

export function LandingHeader() {
  const t = useTranslations<Record<string, unknown>>('landing');
  const nav = (t.nav as Record<string, string>) || {};
  const hero = (t.hero as Record<string, string>) || {};

  return (
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
      <Link
        to="/"
        className="flex items-center gap-2.5 text-xl font-bold text-gray-900 transition-opacity hover:opacity-90"
        aria-label="Démonická"
      >
        <img src="/logo.svg" alt="" className="h-9 w-auto" />
        <span
          className="tracking-tight"
          style={{ color: 'var(--color-primary-500)' }}
        >
          Démonická
        </span>
      </Link>

      <nav className="hidden items-center gap-10 md:flex">
        {anchorLinks.map(({ id, key }) => (
          <a
            key={id}
            href={`#${id}`}
            className="text-sm font-medium text-gray-600 transition-colors hover:[color:var(--color-primary-500)]"
          >
            {nav[key] ?? key}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          {hero.login ?? 'Přihlášení'}
        </Link>
        <Link
          to="/register"
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          {hero.register ?? 'Registrace'}
        </Link>
      </div>
    </div>
  );
}
