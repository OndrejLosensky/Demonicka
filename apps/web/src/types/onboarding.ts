export type TooltipPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: TooltipPlacement;
  route: string;
  action?: 'click' | 'input' | 'none';
}

export interface OnboardingTour {
  id: string;
  version: string;
  entryRoute: string;
  allowedRoutes: string[];
  steps: OnboardingStep[];
}
