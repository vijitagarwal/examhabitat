import React, { useEffect } from 'react';
import type { ExamConfig } from '@/lib/exams';

interface ExamThemeProviderProps {
  examConfig: ExamConfig;
  children: React.ReactNode;
}

export function ExamThemeProvider({ examConfig, children }: ExamThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--exam-primary', examConfig.primaryColor);
    root.style.setProperty('--exam-secondary', examConfig.secondaryColor);

    // Apply color transition class for smooth 600ms exam switching effect
    root.classList.add('exam-theme-transition');

    return () => {
      // Clean up if needed
    };
  }, [examConfig]);

  return (
    <div
      className="exam-theme-wrapper contents"
      style={
        {
          '--exam-primary': examConfig.primaryColor,
          '--exam-secondary': examConfig.secondaryColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
