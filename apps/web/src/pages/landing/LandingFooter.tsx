import { Link } from 'react-router-dom';
import { useTranslations } from '../../contexts/LocaleContext';

const footerLinks = [
  { to: '/#features', key: 'nav.features' },
  { to: '/#product', key: 'nav.product' },
  { to: '/#stats', key: 'nav.stats' },
  { to: '/#ios', key: 'nav.ios' },
  { to: '/login', key: 'footer.login' },
  { to: '/register', key: 'footer.register' },
] as const;

export function LandingFooter() {
  const t = useTranslations<Record<string, string>>('landing');
  const footer = (t.footer as unknown as Record<string, string>) || {};
  const nav = (t.nav as unknown as Record<string, string>) || {};

  const getLabel = (key: string) => {
    if (key.startsWith('nav.'))
      return nav[key.replace('nav.', '')] ?? key;
    if (key.startsWith('footer.'))
      return footer[key.replace('footer.', '')] ?? key;
    return key;
  };

  return (
    <footer className="border-t border-gray-200 bg-gray-50/80 py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-xl font-bold text-gray-900 transition-opacity hover:opacity-90"
          >
            <img src="/logo.svg" alt="" className="h-7 w-auto" />
            <span
              style={{ color: 'var(--color-primary-500)' }}
            >
              Démonická
            </span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-8">
            {footerLinks.map(({ to, key }) => (
              <Link
                key={key}
                to={to}
                className="text-sm font-medium text-gray-600 transition-colors hover:[color:var(--color-primary-500)]"
              >
                {getLabel(key)}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Démonická.{' '}
            {footer.allRightsReserved ?? 'Všechna práva vyhrazena.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
