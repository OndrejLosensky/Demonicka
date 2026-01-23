import type { ReactNode } from 'react';
import { Card } from '@demonicka/ui';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Zpět na hlavní stránku
        </Link>

        {/* Auth card */}
        <Card className="w-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8 pt-6">
            <div className="flex justify-center mb-6">
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <div className="px-6 pb-6">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
} 