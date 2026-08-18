'use client';

import { Wallet, CreditCard, GraduationCap, Umbrella, Heart, ShieldCheck, PiggyBank, TrendingUp } from 'lucide-react';
import type { FHCResult, FHCFormData } from '@/lib/fhc/types';
import { CATEGORY_COLORS } from '@/lib/fhc/constants';
import { formatBaht } from '@/lib/fhc/formatters';

interface FHCDetailedBreakdownProps {
  result: FHCResult;
  formData: FHCFormData;
}

const NEED_CATEGORIES = [
  { key: 'incomeReplacement' as const, label: 'ทดแทนรายได้ครอบครัว', Icon: Wallet, colorKey: 'incomeReplacement' as const },
  { key: 'debtCoverage' as const, label: 'ปิดหนี้สิน', Icon: CreditCard, colorKey: 'debtCoverage' as const },
  { key: 'educationFund' as const, label: 'กองทุนการศึกษา', Icon: GraduationCap, colorKey: 'educationFund' as const },
  { key: 'emergencyFund' as const, label: 'เงินสำรองฉุกเฉิน', Icon: Umbrella, colorKey: 'emergencyFund' as const },
  { key: 'finalExpenses' as const, label: 'ค่างานศพและค่ารักษาสุดท้าย', Icon: Heart, colorKey: 'finalExpenses' as const },
];

export default function FHCDetailedBreakdown({ result, formData }: FHCDetailedBreakdownProps) {
  const { totalNeed } = result;

  return (
    <div className="space-y-6">
      {/* Need categories */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">รายละเอียดความคุ้มครองที่แนะนำ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NEED_CATEGORIES.map((cat) => {
            const value = result[cat.key];
            if (value === 0) return null;
            const percentage = totalNeed > 0 ? Math.round((value / totalNeed) * 100) : 0;

            return (
              <div
                key={cat.key}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${CATEGORY_COLORS[cat.colorKey]}20` }}
                >
                  <cat.Icon
                    className="w-5 h-5"
                    style={{ color: CATEGORY_COLORS[cat.colorKey] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{cat.label}</p>
                  <p className="font-bold text-foreground">{formatBaht(value)}</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Existing coverage */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">ความคุ้มครองที่มี</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">วงเงินคุ้มครองชีวิต</p>
              <p className="font-bold text-foreground">
                {formatBaht(formData.existingCoverage.lifeInsuranceSumAssured)}
              </p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">เงินออมที่นับรองรับส่วนอื่น</p>
              <p className="font-bold text-foreground">
                {formatBaht(result.savingsAvailableForProtection)}
              </p>
              {result.emergencyReserveUsed > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  กันไว้เป็นเงินสำรองฉุกเฉินแล้ว {formatBaht(result.emergencyReserveUsed)}
                </p>
              )}
            </div>
          </div>

          {result.emergencyReserveUsed > 0 && (
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Umbrella className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">เงินสำรองฉุกเฉินที่กันไว้</p>
                <p className="font-bold text-foreground">
                  {formatBaht(result.emergencyReserveUsed)}
                </p>
              </div>
            </div>
          )}

          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">เงินลงทุน</p>
              <p className="font-bold text-foreground">
                {formatBaht(formData.existingCoverage.investments)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
