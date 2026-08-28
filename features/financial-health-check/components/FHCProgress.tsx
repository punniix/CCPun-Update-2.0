'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_LABELS } from '@/features/financial-health-check/calculator/constants';

interface FHCProgressProps {
  currentStep: number; // 0-4
  totalSteps?: number; // default 5
}

export default function FHCProgress({
  currentStep,
  totalSteps = 5,
}: FHCProgressProps) {
  return (
    <div
      className="w-full pb-8 mb-6"
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`ขั้นตอนที่ ${currentStep + 1} จาก ${totalSteps}`}
    >
      <div className="flex items-center">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isFuture = idx > currentStep;

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center',
                idx < totalSteps - 1 ? 'flex-1' : 'flex-initial'
              )}
            >
              {/* Circle + label */}
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    isCurrent &&
                      'border-primary text-primary ring-2 ring-primary/50 bg-transparent animate-scale-in',
                    isFuture &&
                      'border-muted text-muted-foreground bg-transparent'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label — visible on desktop only, centered under dot */}
                <span
                  className={cn(
                    'hidden md:block absolute top-full mt-2 text-xs whitespace-nowrap transition-colors duration-300',
                    'left-1/2 -translate-x-1/2',
                    isCompleted && 'text-primary',
                    isCurrent && 'text-primary font-medium',
                    isFuture && 'text-muted-foreground'
                  )}
                >
                  {STEP_LABELS[idx]}
                </span>
              </div>

              {/* Connecting line (not after last circle) */}
              {idx < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-1 md:mx-2 relative overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: idx < currentStep ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile — show current step name */}
      <p className="text-sm text-center text-muted-foreground mt-3 md:hidden">
        ขั้นตอนที่ {currentStep + 1}: {STEP_LABELS[currentStep]}
      </p>
    </div>
  );
}
