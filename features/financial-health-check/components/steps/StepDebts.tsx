'use client';

import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CurrencyInput from '@/components/ui/CurrencyInput';
import type { FHCFormData, DebtItem, DebtType } from '@/features/financial-health-check/calculator/types';
import { DEBT_TYPES } from '@/features/financial-health-check/calculator/constants';
import { formatBaht } from '@/lib/shared/formatters';
import { useState } from 'react';

interface StepProps {
  data: FHCFormData;
  updateData: (section: keyof FHCFormData, value: FHCFormData[keyof FHCFormData]) => void;
  errors: Record<string, string>;
}

export default function StepDebts({ data, updateData }: StepProps) {
  const [noDebt, setNoDebt] = useState(data.debts.items.length === 0 && data.debts.totalDebt === 0);

  const handleToggleNoDebt = () => {
    const next = !noDebt;
    setNoDebt(next);
    if (next) {
      updateData('debts', { items: [], totalDebt: 0 });
    }
  };

  const addDebtItem = () => {
    const newItem: DebtItem = {
      type: 'mortgage',
      label: DEBT_TYPES[0].label,
      outstandingBalance: 0,
    };
    const newItems = [...data.debts.items, newItem];
    const total = newItems.reduce((s, i) => s + i.outstandingBalance, 0);
    updateData('debts', { items: newItems, totalDebt: total });
  };

  const removeDebtItem = (index: number) => {
    const newItems = data.debts.items.filter((_, i) => i !== index);
    const total = newItems.reduce((s, i) => s + i.outstandingBalance, 0);
    updateData('debts', { items: newItems, totalDebt: total });
  };

  const updateDebtType = (index: number, type: DebtType) => {
    const debtLabel = DEBT_TYPES.find((d) => d.value === type)?.label || '';
    const newItems = data.debts.items.map((item, i) =>
      i === index ? { ...item, type, label: debtLabel } : item
    );
    updateData('debts', { items: newItems, totalDebt: data.debts.totalDebt });
  };

  const updateDebtBalance = (index: number, balance: number) => {
    const newItems = data.debts.items.map((item, i) =>
      i === index ? { ...item, outstandingBalance: balance } : item
    );
    const total = newItems.reduce((s, i) => s + i.outstandingBalance, 0);
    updateData('debts', { items: newItems, totalDebt: total });
  };

  return (
    <div className="form-glass p-5 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">หนี้สินและภาระ</h2>
          <p className="text-sm text-muted-foreground">ใส่เฉพาะยอดคงค้าง ไม่ต้องรวมดอกเบี้ย</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Toggle no debt — accessible checkbox */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={noDebt}
            onChange={handleToggleNoDebt}
            className="sr-only"
            id="fhc-noDebt"
          />
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              'group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-ring group-has-[:focus-visible]:ring-offset-2 group-has-[:focus-visible]:ring-offset-background',
              noDebt
                ? 'bg-primary border-primary'
                : 'border-border/50 group-hover:border-primary/50'
            )}
            aria-hidden="true"
          >
            {noDebt && (
              <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm text-foreground">
            ไม่มีหนี้สิน
          </span>
        </label>

        {/* Debt items */}
        {!noDebt && (
          <>
            <div className="space-y-4">
              {data.debts.items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 rounded-xl bg-background/30 border border-border/30"
                >
                  {/* Debt type select */}
                  <label htmlFor={`fhc-debt-type-${index}`} className="sr-only">ประเภทหนี้สิน</label>
                  <select
                    id={`fhc-debt-type-${index}`}
                    value={item.type}
                    onChange={(e) => updateDebtType(index, e.target.value as DebtType)}
                    className="w-full sm:w-44 h-12 rounded-md border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {DEBT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>

                  {/* Balance input */}
                  <div className="flex-1 w-full">
                    <label htmlFor={`fhc-debt-balance-${index}`} className="sr-only">ยอดคงค้าง</label>
                    <CurrencyInput
                      id={`fhc-debt-balance-${index}`}
                      value={item.outstandingBalance}
                      onChange={(v) => updateDebtBalance(index, v)}
                      placeholder="ยอดคงค้าง"
                    />
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeDebtItem(index)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`ลบหนี้สิน ${item.label}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Empty state — add button only, no redundant text */}
            {data.debts.items.length === 0 && (
              <div className="text-center py-6">
                <button
                  type="button"
                  onClick={addDebtItem}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/15 border-2 border-primary/30 text-primary font-semibold hover:bg-primary/25 hover:border-primary/50 transition-all duration-200 min-h-[48px]"
                >
                  <Plus className="w-5 h-5" />
                  เพิ่มรายการหนี้สิน
                </button>
              </div>
            )}

            {/* Add more button — when already has items */}
            {data.debts.items.length > 0 && (
              <button
                type="button"
                onClick={addDebtItem}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-3 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                เพิ่มหนี้สินอีกรายการ
              </button>
            )}

            {/* Running total */}
            {data.debts.totalDebt > 0 && (
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">รวมหนี้สินทั้งหมด</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatBaht(data.debts.totalDebt)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
