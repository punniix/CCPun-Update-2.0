'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CurrencyInput from '@/components/ui/CurrencyInput';
import type { FHCFormData, ChildEducation } from '@/features/financial-health-check/calculator/types';
import { formatBaht } from '@/lib/shared/formatters';

interface StepProps {
  data: FHCFormData;
  updateData: (section: keyof FHCFormData, value: FHCFormData[keyof FHCFormData]) => void;
  errors: Record<string, string>;
}

export default function StepDependentsEducation({ data, updateData, errors }: StepProps) {
  const { numberOfDependents, yearsOfSupport, numberOfChildren, children } =
    data.dependents;

  const otherDependentsInit = Math.max(0, numberOfDependents - numberOfChildren);

  const [childStr, setChildStr] = useState(numberOfChildren === 0 ? '' : String(numberOfChildren));
  const [otherStr, setOtherStr] = useState(otherDependentsInit === 0 ? '' : String(otherDependentsInit));
  const [yearsStr, setYearsStr] = useState(yearsOfSupport === 0 ? '' : String(yearsOfSupport));

  // Compute total education from children array
  const computeTotal = (kids: ChildEducation[]) =>
    kids.reduce((sum, c) => sum + c.costPerYear * c.yearsRemaining, 0);

  const computeAvg = (kids: ChildEducation[]) =>
    kids.length > 0 ? computeTotal(kids) / kids.length : 0;

  // Sync children array when numberOfChildren changes
  const handleChildrenChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setChildStr(cleaned);
    const count = cleaned === '' ? 0 : parseInt(cleaned, 10);
    if (isNaN(count)) return;

    // Resize children array
    let newChildren = [...(data.dependents.children || [])];
    if (count > newChildren.length) {
      // Add new children with defaults
      for (let i = newChildren.length; i < count; i++) {
        newChildren.push({ costPerYear: 0, yearsRemaining: 0 });
      }
    } else if (count < newChildren.length) {
      newChildren = newChildren.slice(0, count);
    }

    const others = parseInt(otherStr || '0', 10) || 0;
    updateData('dependents', {
      ...data.dependents,
      numberOfChildren: count,
      numberOfDependents: count + others,
      children: newChildren,
      educationCostPerChild: computeAvg(newChildren),
    });
  };

  const handleOtherChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setOtherStr(cleaned);
    const others = cleaned === '' ? 0 : parseInt(cleaned, 10);
    if (isNaN(others)) return;
    updateData('dependents', {
      ...data.dependents,
      numberOfDependents: numberOfChildren + others,
    });
  };

  const handleYearsChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setYearsStr(cleaned);
    const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
    if (isNaN(num)) return;
    updateData('dependents', { ...data.dependents, yearsOfSupport: num });
  };

  const updateChild = (index: number, field: keyof ChildEducation, value: number) => {
    const newChildren = [...(data.dependents.children || [])];
    newChildren[index] = { ...newChildren[index], [field]: value };
    updateData('dependents', {
      ...data.dependents,
      children: newChildren,
      educationCostPerChild: computeAvg(newChildren),
    });
  };

  const totalDependents = numberOfDependents;
  const totalEducation = computeTotal(children || []);

  return (
    <div className="form-glass p-5 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">คนที่คุณดูแลและการศึกษาบุตร</h2>
          <p className="text-sm text-muted-foreground">คนที่พึ่งพารายได้ของคุณ</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* จำนวนบุตร */}
        <div className="space-y-2">
          <label htmlFor="fhc-numberOfChildren" className="text-sm font-medium text-foreground">
            จำนวนบุตร
          </label>
          <Input
            id="fhc-numberOfChildren"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={childStr}
            onChange={(e) => handleChildrenChange(e.target.value)}
            placeholder="0"
            className={cn(
              'bg-background/50 border-border/50 focus:border-primary/50 h-12 text-foreground placeholder:text-muted-foreground',
              errors.numberOfChildren && 'border-destructive'
            )}
          />
          {errors.numberOfChildren && (
            <p role="alert" className="text-destructive text-sm">{errors.numberOfChildren}</p>
          )}
        </div>

        {/* Per-child education — แสดงเมื่อ children > 0 */}
        <AnimatePresence>
          {numberOfChildren > 0 && (children || []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">ค่าการศึกษาแต่ละคน</p>

                {(children || []).map((child, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-background/30 border border-border/30 space-y-3"
                  >
                    <p className="text-xs font-semibold text-primary">
                      ลูกคนที่ {index + 1}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">ค่าใช้จ่ายต่อปี</label>
                        <CurrencyInput
                          id={`fhc-child-cost-${index}`}
                          value={child.costPerYear}
                          onChange={(v) => updateChild(index, 'costPerYear', v)}
                          placeholder="200,000"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">อีกกี่ปีจึงจบ</label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={child.yearsRemaining === 0 ? '' : String(child.yearsRemaining)}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9]/g, '');
                            const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
                            if (!isNaN(num)) updateChild(index, 'yearsRemaining', num);
                          }}
                          placeholder="4"
                          className="bg-background/50 border-border/50 focus:border-primary/50 h-12 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    {child.costPerYear > 0 && child.yearsRemaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        รวม: {formatBaht(child.costPerYear * child.yearsRemaining)}
                      </p>
                    )}
                  </div>
                ))}

                {/* Grand total */}
                {totalEducation > 0 && (
                  <div className="p-3 rounded-xl bg-primary/8 border border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      รวมค่าการศึกษาทั้งหมด: {formatBaht(totalEducation)}
                    </p>
                  </div>
                )}
                {errors.children && (
                  <p role="alert" className="text-destructive text-sm">{errors.children}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* คนอื่นที่ดูแล */}
        <div className="space-y-2">
          <label htmlFor="fhc-otherDependents" className="text-sm font-medium text-foreground">
            คนอื่นที่ดูแล (พ่อแม่ คู่สมรส ญาติ)
          </label>
          <Input
            id="fhc-otherDependents"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={otherStr}
            onChange={(e) => handleOtherChange(e.target.value)}
            placeholder="0"
            className="bg-background/50 border-border/50 focus:border-primary/50 h-12 text-foreground placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            นอกจากบุตร — ใส่จำนวนคนที่ยังพึ่งพารายได้ของคุณ
          </p>
        </div>

        {/* สรุปรวม + ปีที่ต้องดูแล */}
        <AnimatePresence>
          {totalDependents > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-primary/8 border border-primary/20">
                  <p className="text-sm text-primary font-medium">
                    รวมคนที่ดูแลทั้งหมด: {totalDependents} คน
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="fhc-yearsOfSupport" className="text-sm font-medium text-foreground">
                    ระยะเวลาที่ต้องดูแลพวกเขา (ปี)
                  </label>
                  <Input
                    id="fhc-yearsOfSupport"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={yearsStr}
                    onChange={(e) => handleYearsChange(e.target.value)}
                    placeholder="10"
                    className={cn(
                      'bg-background/50 border-border/50 focus:border-primary/50 h-12 text-foreground placeholder:text-muted-foreground',
                      errors.yearsOfSupport && 'border-destructive'
                    )}
                  />
                  {errors.yearsOfSupport && (
                    <p role="alert" className="text-destructive text-sm">{errors.yearsOfSupport}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    นับจากวันนี้จนกว่าจะพึ่งตัวเองได้
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
