import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import translations from '../../locales/cs/auth.json';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const features = translations.common.features.list;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-background-secondary py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-primary-500 hover:text-primary-600 transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            {translations.common.backToHome}
          </Link>
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

      {/* Right side - Features */}
      <div className="hidden lg:block lg:w-2/5 relative p-4">
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-xl m-4"
          style={{ backgroundImage: 'url(/images/bg.PNG)' }}
        />
        <div className="relative z-10 w-full h-full flex items-center p-4">
          <div className="w-full">
            <div className="relative mx-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`w-full transition-all duration-500 transform ${
                    index === currentFeatureIndex
                      ? 'opacity-100 translate-x-0'
                      : index < currentFeatureIndex
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                  }`}
                  style={{
                    position: index === currentFeatureIndex ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-white">
                    <h3 className="text-2xl font-bold mb-6">{translations.common.features.title}</h3>
                    <div className="flex items-start space-x-4">
                      <div>
                        <h4 className="text-lg font-semibold">{feature.title}</h4>
                        <p className="text-sm opacity-80 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-1.5 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentFeatureIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                  onClick={() => setCurrentFeatureIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 