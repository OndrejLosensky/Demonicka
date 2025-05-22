import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card className="w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm text-text-tertiary">{subtitle}</p>
            )}
          </div>
          <div className="px-4 sm:px-6">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
} 