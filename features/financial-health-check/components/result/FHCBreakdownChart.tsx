'use client';

import type { FHCResult } from '@/features/financial-health-check/calculator/types';
import { CATEGORY_COLORS } from '@/features/financial-health-check/calculator/constants';
import { formatBaht } from '@/lib/shared/formatters';

interface FHCBreakdownChartProps {
  result: FHCResult;
}

const CATEGORIES: {
  key: keyof typeof CATEGORY_COLORS;
  resultKey: keyof FHCResult;
  label: string;
}[] = [
  { key: 'incomeReplacement', resultKey: 'incomeReplacement', label: 'ทดแทนรายได้ครอบครัว' },
  { key: 'debtCoverage', resultKey: 'debtCoverage', label: 'ปิดหนี้สิน' },
  { key: 'educationFund', resultKey: 'educationFund', label: 'กองทุนการศึกษา' },
  { key: 'emergencyFund', resultKey: 'emergencyFund', label: 'เงินสำรองฉุกเฉิน' },
  { key: 'finalExpenses', resultKey: 'finalExpenses', label: 'ค่างานศพและค่ารักษาสุดท้าย' },
];

export default function FHCBreakdownChart({ result }: FHCBreakdownChartProps) {
  const { totalNeed } = result;
  if (totalNeed === 0) return null;

  // Filter out zero-value categories
  const activeCategories = CATEGORIES.filter(
    (cat) => (result[cat.resultKey] as number) > 0
  );

  // Calculate percentages with minimum width enforcement
  const minPercentage = 3;
  const rawPercentages = activeCategories.map((cat) => {
    const value = result[cat.resultKey] as number;
    return (value / totalNeed) * 100;
  });

  // Enforce minimum — redistribute excess from larger segments
  const adjustedPercentages = rawPercentages.map((p) => Math.max(p, minPercentage));
  const totalAdjusted = adjustedPercentages.reduce((sum, p) => sum + p, 0);
  const normalizedPercentages = adjustedPercentages.map((p) => (p / totalAdjusted) * 100);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">สัดส่วนความคุ้มครองที่แนะนำ</h3>

      {/* Stacked bar — CSS animation instead of framer-motion */}
      <div className="h-8 rounded-full overflow-hidden flex bg-background/30 border border-border/30">
        {activeCategories.map((cat, index) => {
          const value = result[cat.resultKey] as number;
          const rawPercentage = (value / totalNeed) * 100;
          const displayPercentage = normalizedPercentages[index];

          return (
            <div
              key={cat.key}
              className="h-full relative group fhc-bar"
              style={{
                width: `${displayPercentage}%`,
                backgroundColor: CATEGORY_COLORS[cat.key],
                animationDelay: `${index * 0.15}s`,
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {cat.label}: {Math.round(rawPercentage)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {activeCategories.map((cat) => {
          const value = result[cat.resultKey] as number;
          const percentage = Math.round((value / totalNeed) * 100);
          return (
            <div key={cat.key} className="flex items-center gap-2 text-sm" tabIndex={0} aria-label={`${cat.label}: ${formatBaht(value)} (${percentage}%)`}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat.key] }}
              />
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-medium text-foreground">{formatBaht(value)} ({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
