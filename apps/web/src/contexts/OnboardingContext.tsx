import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { onboardingService } from '../services/onboardingService';
import type { OnboardingTour, OnboardingStep } from '../types/onboarding';

interface OnboardingContextType {
  currentTour: OnboardingTour | null;
  currentStepIndex: number;
  isActive: boolean;
  startTour: (tourId: string) => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => Promise<void>;
  completeTour: () => Promise<void>;
  currentStep: OnboardingStep | null;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTour, setCurrentTour] = useState<OnboardingTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const currentStep = currentTour?.steps[currentStepIndex] || null;

  // Check if onboarding should be active
  useEffect(() => {
    if (!user || user.onboarded) {
      setIsActive(false);
      return;
    }

    // Try to find a tour for the current route
    const findTourForRoute = async () => {
      try {
        // For now, check if we're on dashboard route
        if (location.pathname === '/dashboard') {
          const tour = await onboardingService.getTourConfig('dashboard-tour');
          if (tour.allowedRoutes.includes(location.pathname)) {
            setCurrentTour(tour);
            setIsActive(true);
            setCurrentStepIndex(0);
          }
        }
      } catch (error) {
        console.error('Failed to load tour config:', error);
      }
    };

    findTourForRoute();
  }, [user, location.pathname]);

  const startTour = useCallback(async (tourId: string) => {
    try {
      const tour = await onboardingService.getTourConfig(tourId);
      setCurrentTour(tour);
      setCurrentStepIndex(0);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start tour:', error);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (!currentTour) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= currentTour.steps.length) {
      completeTour();
      return;
    }

    const nextStep = currentTour.steps[nextIndex];
    
    // Navigate if route changed
    if (nextStep.route !== location.pathname) {
      navigate(nextStep.route);
    }

    setCurrentStepIndex(nextIndex);
  }, [currentTour, currentStepIndex, location.pathname, navigate]);

  const previousStep = useCallback(() => {
    if (!currentTour || currentStepIndex === 0) return;

    const prevIndex = currentStepIndex - 1;
    const prevStep = currentTour.steps[prevIndex];
    
    // Navigate if route changed
    if (prevStep.route !== location.pathname) {
      navigate(prevStep.route);
    }

    setCurrentStepIndex(prevIndex);
  }, [currentTour, currentStepIndex, location.pathname, navigate]);

  const skipTour = useCallback(async () => {
    try {
      await onboardingService.completeOnboarding();
      await refreshUser();
      setIsActive(false);
      setCurrentTour(null);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Failed to skip tour:', error);
    }
  }, [refreshUser]);

  const completeTour = useCallback(async () => {
    try {
      await onboardingService.completeOnboarding();
      await refreshUser();
      setIsActive(false);
      setCurrentTour(null);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Failed to complete tour:', error);
    }
  }, [refreshUser]);

  const value: OnboardingContextType = {
    currentTour,
    currentStepIndex,
    isActive,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    currentStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
