'use client';

import { Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import CurrencyInput from '../CurrencyInput';
import type { FHCFormData } from '@/lib/fhc/types';

interface StepProps {
  data: FHCFormData;
  updateData: (section: keyof FHCFormData, value: FHCFormData[keyof FHCFormData]) => void;
  errors: Record<string, string>;
}

export default function StepIncomeExpenses({ data, updateData, errors }: StepProps) {
  const { monthlyIncome, monthlyExpenses, spouseIncome } = data.incomeExpenses;

  const handleChange = (field: 'monthlyIncome' | 'monthlyExpenses' | 'spouseIncome', value: number) => {
    updateData('incomeExpenses', { ...data.incomeExpenses, [field]: value });
  };

  // Expense ratio calculation
  const expenseRatio = monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0;
  const ratioColor =
    expenseRatio > 80
      ? 'text-red-400 bg-red-400/10 border-red-400/30'
      : expenseRatio > 50
        ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
        : 'text-gold-400 bg-gold-400/10 border-gold-400/30';

  return (
    <div className="form-glass p-5 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Banknote className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">รายได้และค่าใช้จ่าย</h2>
          <p className="text-sm text-muted-foreground">ไม่ต้องแม่นยำ 100% — ประมาณการก็ได้</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* รายได้ต่อเดือน */}
        <div className="space-y-2">
          <label htmlFor="fhc-monthlyIncome" className="text-sm font-medium text-foreground">
            รายได้ต่อเดือน <span className="text-destructive">*</span>
          </label>
          <CurrencyInput
            id="fhc-monthlyIncome"
            value={monthlyIncome}
            onChange={(v) => handleChange('monthlyIncome', v)}
            placeholder="50,000"
            error={!!errors.monthlyIncome}
            aria-describedby={errors.monthlyIncome ? 'fhc-monthlyIncome-error' : undefined}
          />
          {errors.monthlyIncome && (
            <p id="fhc-monthlyIncome-error" role="alert" className="text-destructive text-sm">{errors.monthlyIncome}</p>
          )}
          <p className="text-xs text-muted-foreground">
            รายได้รวมทั้งหมดต่อเดือน ก่อนหักภาษี
          </p>
        </div>

        {/* ค่าใช้จ่ายต่อเดือน */}
        <div className="space-y-2">
          <label htmlFor="fhc-monthlyExpenses" className="text-sm font-medium text-foreground">
            ค่าใช้จ่ายต่อเดือน <span className="text-destructive">*</span>
          </label>
          <CurrencyInput
            id="fhc-monthlyExpenses"
            value={monthlyExpenses}
            onChange={(v) => handleChange('monthlyExpenses', v)}
            placeholder="30,000"
            error={!!errors.monthlyExpenses}
            aria-describedby={errors.monthlyExpenses ? 'fhc-monthlyExpenses-error' : undefined}
          />
          {errors.monthlyExpenses && (
            <p id="fhc-monthlyExpenses-error" role="alert" className="text-destructive text-sm">{errors.monthlyExpenses}</p>
          )}
          <p className="text-xs text-muted-foreground">
            รวมทุกค่าใช้จ่าย: ค่ากิน ค่าเดินทาง ค่าที่อยู่ ค่า subscription ฯลฯ
          </p>
        </div>

        {/* รายได้คู่สมรส (optional) */}
        <div className="space-y-2">
          <label htmlFor="fhc-spouseIncome" className="text-sm font-medium text-foreground">
            รายได้คู่สมรส (ถ้ามี)
            <span className="ml-2 text-xs text-muted-foreground font-normal">— ไม่บังคับ</span>
          </label>
          <CurrencyInput
            id="fhc-spouseIncome"
            value={spouseIncome}
            onChange={(v) => handleChange('spouseIncome', v)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            ถ้า 0 หรือไม่มีคู่สมรส ข้ามได้เลย — ใช้คำนวณว่าครอบครัวมีรายได้รองรับส่วนใดอยู่แล้ว
          </p>
        </div>

        {/* Expense Ratio Badge */}
        {monthlyIncome > 0 && monthlyExpenses > 0 && (
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium',
              ratioColor
            )}
          >
            <span>สัดส่วนค่าใช้จ่าย/รายได้:</span>
            <span className="font-bold">{expenseRatio}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
