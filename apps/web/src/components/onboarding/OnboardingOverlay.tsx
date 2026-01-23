import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useFloating, autoUpdate, offset, shift, flip } from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { tokens } from '../../theme/tokens';

export function OnboardingOverlay() {
  const { currentStep, currentTour, currentStepIndex, nextStep, previousStep, skipTour, completeTour, isActive } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const retryCountRef = useRef(0);
  const maxRetries = 30; // 3 seconds with 100ms intervals

  // Find target element
  useEffect(() => {
    if (!currentStep || !isActive) {
      setTargetElement(null);
      setIsVisible(false);
      return;
    }

    const findElement = () => {
      const selector = `[data-onboard="${currentStep.target}"]`;
      const element = document.querySelector<HTMLElement>(selector);
      
      if (element) {
        setTargetElement(element);
        setIsVisible(true);
        retryCountRef.current = 0;
      } else if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(findElement, 100);
      } else {
        console.warn(`Onboarding target not found: ${currentStep.target}`);
        setIsVisible(false);
      }
    };

    findElement();
  }, [currentStep, isActive]);

  // Floating UI positioning
  const { refs, floatingStyles, placement } = useFloating({
    elements: {
      reference: targetElement,
    },
    placement: (currentStep?.placement as Placement) || 'bottom',
    middleware: [offset(16), shift({ padding: 8 }), flip()],
    whileElementsMounted: autoUpdate,
  });

  // Update floating reference when target element changes
  useEffect(() => {
    if (targetElement) {
      refs.setReference(targetElement);
    }
  }, [targetElement, refs]);

  // Update highlight position when target element changes
  useEffect(() => {
    if (!targetElement) {
      setHighlightStyle({});
      return;
    }

    const updateHighlight = () => {
      const rect = targetElement.getBoundingClientRect();
      setHighlightStyle({
        position: 'fixed',
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        borderRadius: tokens.borderRadius.xs,
        pointerEvents: 'none',
        zIndex: tokens.zIndex.overlay + 1,
        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(255, 59, 48, 0.4)`,
        backgroundColor: 'transparent',
        transition: tokens.transitions.fast,
      });
    };

    updateHighlight();
    window.addEventListener('scroll', updateHighlight, true);
    window.addEventListener('resize', updateHighlight);

    return () => {
      window.removeEventListener('scroll', updateHighlight, true);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [targetElement]);

  // Early return after all hooks
  if (!isActive || !currentStep || !currentTour || !isVisible || !targetElement) {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === currentTour.steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
    } else {
      nextStep();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: tokens.zIndex.overlay,
          transition: tokens.transitions.fast,
        }}
      />

      {/* Highlight */}
      <Box sx={highlightStyle} />

      {/* Tooltip */}
      <Paper
        ref={refs.setFloating}
        style={{
          ...floatingStyles,
          zIndex: tokens.zIndex.tooltip,
          maxWidth: 400,
          padding: 16,
          transition: tokens.transitions.fast,
        }}
        elevation={8}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {currentStep.title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {currentStep.description}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={skipTour}
            sx={{ textTransform: 'none' }}
          >
            Přeskočit
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isFirstStep && (
              <Button
                size="small"
                variant="outlined"
                onClick={previousStep}
                sx={{ textTransform: 'none' }}
              >
                Zpět
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              onClick={handleNext}
              sx={{ textTransform: 'none' }}
            >
              {isLastStep ? 'Dokončit' : 'Další'}
            </Button>
          </Box>
        </Box>

        {/* Step indicator */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          {currentTour.steps.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: index === currentStepIndex ? 'primary.main' : 'action.disabled',
                transition: tokens.transitions.fast,
              }}
            />
          ))}
        </Box>
      </Paper>
    </>
  );
}
