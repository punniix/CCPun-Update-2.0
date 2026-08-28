'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FHCFormData } from '@/features/financial-health-check/calculator/types';

interface StepProps {
  data: FHCFormData;
  updateData: (section: keyof FHCFormData, value: FHCFormData[keyof FHCFormData]) => void;
  errors: Record<string, string>;
}

export default function StepPersonalInfo({ data, updateData, errors }: StepProps) {
  const { age, retirementAge } = data.personalInfo;

  // Local string state: เริ่มว่างถ้า 0 (ยังไม่กรอก) แต่เก็บค่าจริงเมื่อ user พิมพ์
  const [ageStr, setAgeStr] = useState(age === 0 ? '' : String(age));
  const [retirementAgeStr, setRetirementAgeStr] = useState(
    retirementAge === 0 ? '' : String(retirementAge)
  );

  const handleChange = (field: 'age' | 'retirementAge', value: string) => {
    // Strip non-numeric characters (prevent negative/special chars)
    const cleaned = value.replace(/[^0-9]/g, '');

    if (field === 'age') setAgeStr(cleaned);
    else setRetirementAgeStr(cleaned);

    const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
    if (isNaN(num)) return;
    updateData('personalInfo', { ...data.personalInfo, [field]: num });
  };

  return (
    <div className="form-glass p-5 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">ข้อมูลส่วนตัว</h2>
          <p className="text-sm text-muted-foreground">กรอกข้อมูลเบื้องต้นของคุณ</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* อายุ */}
        <div className="space-y-2">
          <label htmlFor="fhc-age" className="text-sm font-medium text-foreground">
            อายุ (ปี) <span className="text-destructive">*</span>
          </label>
          <Input
            id="fhc-age"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={ageStr}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="เช่น 30"
            aria-describedby={errors.age ? 'fhc-age-error' : undefined}
            className={cn(
              'bg-background/50 border-border/50 focus:border-primary/50 h-12 text-foreground placeholder:text-muted-foreground',
              errors.age && 'border-destructive'
            )}
          />
          {errors.age && <p id="fhc-age-error" role="alert" className="text-destructive text-sm">{errors.age}</p>}
        </div>

        {/* อายุเกษียณ */}
        <div className="space-y-2">
          <label htmlFor="fhc-retirementAge" className="text-sm font-medium text-foreground">
            อายุเกษียณ (ปี)
          </label>
          <Input
            id="fhc-retirementAge"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={retirementAgeStr}
            onChange={(e) => handleChange('retirementAge', e.target.value)}
            placeholder="เช่น 60"
            aria-describedby={errors.retirementAge ? 'fhc-retirementAge-error' : undefined}
            className={cn(
              'bg-background/50 border-border/50 focus:border-primary/50 h-12 text-foreground placeholder:text-muted-foreground',
              errors.retirementAge && 'border-destructive'
            )}
          />
          {errors.retirementAge && (
            <p id="fhc-retirementAge-error" role="alert" className="text-destructive text-sm">{errors.retirementAge}</p>
          )}
          <p className="text-xs text-muted-foreground">
            เริ่มต้นที่ 60 ปี — วางแผน FIRE? ปรับลงได้ตั้งแต่ 30 ปี
          </p>
        </div>
      </div>
    </div>
  );
}
