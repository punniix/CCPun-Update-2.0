'use client';

import { useCallback } from 'react';
import { ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_ITEMS } from '@/features/financial-health-check/calculator/constants';
import type { FHCFormData, Priorities } from '@/features/financial-health-check/calculator/types';

interface StepProps {
  data: FHCFormData;
  updateData: (section: keyof FHCFormData, value: FHCFormData[keyof FHCFormData]) => void;
  errors: Record<string, string>;
}

const RANK_LABELS = ['', 'สำคัญมากที่สุด', 'สำคัญมาก', 'สำคัญ', 'สำคัญน้อย', 'สำคัญน้อยที่สุด'];

export default function StepPriorities({ data, updateData, errors }: StepProps) {
  const priorities = data.priorities;

  const nextRank = useCallback(() => {
    const used = PRIORITY_ITEMS.filter((item) => priorities[item.key] > 0).length;
    return used + 1;
  }, [priorities]);

  const handleTap = (key: keyof Priorities) => {
    const currentRank = priorities[key];

    if (currentRank > 0) {
      // Unrank this item and shift others down
      const newPriorities = { ...priorities };
      newPriorities[key] = 0;

      // Re-number remaining items to fill the gap
      PRIORITY_ITEMS.forEach((item) => {
        if (newPriorities[item.key] > currentRank) {
          newPriorities[item.key] -= 1;
        }
      });

      updateData('priorities', newPriorities);
    } else {
      // Assign next rank
      const rank = nextRank();
      if (rank <= 5) {
        updateData('priorities', { ...priorities, [key]: rank });
      }
    }
  };

  const handleReset = () => {
    updateData('priorities', {
      incomeProtection: 0,
      retirementSavings: 0,
      medicalExpenses: 0,
      criticalIllness: 0,
      childEducation: 0,
    });
  };

  return (
    <div className="form-glass p-5 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ListOrdered className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">สิ่งที่คุณให้ความสำคัญ</h2>
          <p className="text-sm text-muted-foreground">กดเลือกทีละข้อตามลำดับที่สำคัญสำหรับคุณ — กดข้อแรก = สำคัญที่สุด (เลือกอย่างน้อย 3 ข้อ)</p>
        </div>
      </div>

      <div className="space-y-3">
        {PRIORITY_ITEMS.map((item) => {
          const rank = priorities[item.key];
          const isRanked = rank > 0;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleTap(item.key)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left min-h-[60px]',
                isRanked
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border/30 bg-background/30 hover:border-primary/30 hover:bg-white/5'
              )}
            >
              {/* Rank badge or empty circle */}
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-200',
                  isRanked
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'border-2 border-border/50 text-muted-foreground'
                )}
              >
                {isRanked ? rank : ''}
              </div>

              {/* Label */}
              <div className="flex-1">
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isRanked ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {item.key === 'criticalIllness' && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    ครอบคลุมโรคร้ายแรง เช่น มะเร็ง โรคหัวใจ และกรณีพิการถาวร
                  </p>
                )}
                {isRanked && (
                  <p className="text-xs text-primary/70 mt-0.5">
                    {RANK_LABELS[rank]}
                  </p>
                )}
              </div>

              {/* Tap hint */}
              {isRanked && (
                <span className="text-xs text-muted-foreground/50 shrink-0">
                  กดเพื่อยกเลิก
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reset button */}
      {PRIORITY_ITEMS.some((item) => priorities[item.key] > 0) && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-primary transition-colors py-2"
          >
            เริ่มจัดลำดับใหม่
          </button>
        </div>
      )}

      {errors.priorities && (
        <p role="alert" className="text-destructive text-sm mt-3">{errors.priorities}</p>
      )}
    </div>
  );
}
