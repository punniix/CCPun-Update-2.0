'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import CurrencyInput from '@/components/ui/CurrencyInput';
import type { FHCFormData } from '@/features/financial-health-check/calculator/types';
import { formatBaht } from '@/lib/shared/formatters';

interface StepProps {
  data: FHCFormData;
  updateData: (section: keyof FHCFormData, value: FHCFormData[keyof FHCFormData]) => void;
  errors: Record<string, string>;
}

export default function StepExistingCoverage({ data, updateData, errors }: StepProps) {
  const {
    lifeInsuranceSumAssured,
    savings,
    investments,
    hasHealthInsurance,
    healthInsuranceCoverage,
    hasCriticalIllness,
    criticalIllnessCoverage,
    hasSocialSecurity,
    existingEmergencyFund,
  } = data.existingCoverage;

  const handleChange = (field: string, value: number | boolean) => {
    updateData('existingCoverage', { ...data.existingCoverage, [field]: value });
  };

  const totalExisting = lifeInsuranceSumAssured + savings + investments;

  return (
    <div className="form-glass p-5 md:p-8 lg:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">ความคุ้มครองที่มีอยู่</h2>
          <p className="text-sm text-muted-foreground">วงเงินคุ้มครองและเงินออมที่มี</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ──── 1. ประกันชีวิต — familiar ที่สุด ──── */}
        <div className="space-y-2">
          <label htmlFor="fhc-lifeInsuranceSumAssured" className="text-sm font-medium text-foreground">ทุนประกันชีวิตที่มี</label>
          <CurrencyInput
            id="fhc-lifeInsuranceSumAssured"
            value={lifeInsuranceSumAssured}
            onChange={(v) => handleChange('lifeInsuranceSumAssured', v)}
            placeholder="1,000,000"
            error={!!errors.lifeInsuranceSumAssured}
            aria-describedby={errors.lifeInsuranceSumAssured ? 'fhc-lifeInsuranceSumAssured-error' : undefined}
          />
          {errors.lifeInsuranceSumAssured && (
            <p id="fhc-lifeInsuranceSumAssured-error" role="alert" className="text-destructive text-sm">{errors.lifeInsuranceSumAssured}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ทุนประกันชีวิตรวมจากทุกกรมธรรม์
          </p>
        </div>

        {/* ──── 2. ประกันสุขภาพ ──── */}
        <div className="space-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={hasHealthInsurance}
            onClick={() => handleChange('hasHealthInsurance', !hasHealthInsurance)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm font-medium text-foreground">
              มีประกันสุขภาพไหม?
            </span>
            <span
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                hasHealthInsurance ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  hasHealthInsurance ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </span>
          </button>

          {hasHealthInsurance && (
            <div className="space-y-2 pl-1">
              <label htmlFor="fhc-healthInsuranceCoverage" className="text-sm font-medium text-foreground">
                วงเงินความคุ้มครองประกันสุขภาพ
              </label>
              <CurrencyInput
                id="fhc-healthInsuranceCoverage"
                value={healthInsuranceCoverage}
                onChange={(v) => handleChange('healthInsuranceCoverage', v)}
                placeholder="500,000"
              />
              <p className="text-xs text-muted-foreground">
                วงเงินคุ้มครองค่ารักษาพยาบาลรวมจากทุกกรมธรรม์
              </p>
            </div>
          )}
        </div>

        {/* ──── 3. ประกันโรคร้ายแรง (Critical Illness) — ซับซ้อนกว่า ──── */}
        <div className="space-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={hasCriticalIllness}
            onClick={() => handleChange('hasCriticalIllness', !hasCriticalIllness)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="pr-3">
              <span className="text-sm font-medium text-foreground block">
                มีประกันโรคร้ายแรง (Critical Illness) ไหม?
              </span>
              <span className="text-xs text-muted-foreground">
                เช่น มะเร็ง หัวใจ โรคร้ายแรงระยะสุดท้าย และทุพพลภาพถาวร
              </span>
            </div>
            <span
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                hasCriticalIllness ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  hasCriticalIllness ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </span>
          </button>

          {hasCriticalIllness && (
            <div className="space-y-2 pl-1">
              <label htmlFor="fhc-criticalIllnessCoverage" className="text-sm font-medium text-foreground">
                วงเงินความคุ้มครองโรคร้ายแรง
              </label>
              <CurrencyInput
                id="fhc-criticalIllnessCoverage"
                value={criticalIllnessCoverage}
                onChange={(v) => handleChange('criticalIllnessCoverage', v)}
                placeholder="1,000,000"
              />
              <p className="text-xs text-muted-foreground">
                วงเงินคุ้มครองกรณีตรวจพบโรคร้ายแรงรวมจากทุกกรมธรรม์
              </p>
            </div>
          )}
        </div>

        {/* ──── 4. ประกันสังคม/กองทุนสำรอง ──── */}
        <div className="space-y-2">
          <button
            type="button"
            role="switch"
            aria-checked={hasSocialSecurity}
            onClick={() => handleChange('hasSocialSecurity', !hasSocialSecurity)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm font-medium text-foreground">
              มีประกันสังคมหรือกองทุนสำรองเลี้ยงชีพไหม?
            </span>
            <span
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
                hasSocialSecurity ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  hasSocialSecurity ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </span>
          </button>
          <p className="text-xs text-muted-foreground pl-1">
            รวมถึงกองทุน กบข. หรือกองทุนสำรองเลี้ยงชีพของบริษัท
          </p>
        </div>

        {/* ──── 5. เงินออม + เงินสำรองฉุกเฉิน ──── */}
        <div className="space-y-3">
          <label htmlFor="fhc-savings" className="text-sm font-medium text-foreground">
            เงินออมทั้งหมด (ฝากออมทรัพย์/ประจำ)
          </label>
          <CurrencyInput
            id="fhc-savings"
            value={savings}
            onChange={(v) => handleChange('savings', v)}
            placeholder="500,000"
            error={!!errors.savings}
            aria-describedby={errors.savings ? 'fhc-savings-error' : undefined}
          />
          {errors.savings && <p id="fhc-savings-error" role="alert" className="text-destructive text-sm">{errors.savings}</p>}
          <p className="text-xs text-muted-foreground">
            รวมเงินฝากออมทรัพย์ ฝากประจำ และสลากออมทรัพย์ทั้งหมดที่พร้อมใช้
          </p>

          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div>
              <label htmlFor="fhc-existingEmergencyFund" className="text-sm font-medium text-foreground">
                แบ่งเป็นเงินสำรองฉุกเฉินเท่าไร
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                ใส่เฉพาะส่วนที่กันไว้ใช้จ่ายฉุกเฉินจากเงินออมทั้งหมดด้านบน
              </p>
            </div>
            <CurrencyInput
              id="fhc-existingEmergencyFund"
              value={existingEmergencyFund}
              onChange={(v) => handleChange('existingEmergencyFund', v)}
              placeholder="0"
              error={!!errors.existingEmergencyFund}
              aria-describedby={errors.existingEmergencyFund ? 'fhc-existingEmergencyFund-error' : undefined}
            />
            {errors.existingEmergencyFund && (
              <p id="fhc-existingEmergencyFund-error" role="alert" className="text-destructive text-sm">{errors.existingEmergencyFund}</p>
            )}
            <p className="text-xs text-primary/80 leading-relaxed">
              ระบบจะกันเงินส่วนนี้ไว้สำหรับค่าใช้จ่ายประมาณ 6 เดือนก่อน แล้วไม่นับซ้ำเป็นเงินรองรับส่วนอื่น
            </p>
          </div>
        </div>

        {/* ──── 6. เงินลงทุน ──── */}
        <div className="space-y-2">
          <label htmlFor="fhc-investments" className="text-sm font-medium text-foreground">เงินลงทุน (กองทุน/หุ้น/ทอง)</label>
          <CurrencyInput
            id="fhc-investments"
            value={investments}
            onChange={(v) => handleChange('investments', v)}
            placeholder="300,000"
            error={!!errors.investments}
            aria-describedby={errors.investments ? 'fhc-investments-error' : undefined}
          />
          {errors.investments && (
            <p id="fhc-investments-error" role="alert" className="text-destructive text-sm">{errors.investments}</p>
          )}
          <p className="text-xs text-muted-foreground">
            กองทุนรวม หุ้น ทองคำ สินทรัพย์ดิจิทัล
          </p>
        </div>

        {/* ค่าจัดการสุดท้าย removed — ใช้ค่า default ฿200,000 ใน calculator */}

        {/* Running total */}
        {totalExisting > 0 && (
          <div className="pt-4 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ทุนประกันและสินทรัพย์ที่กรอก</span>
              <span className="text-lg font-bold text-gold-400">
                {formatBaht(totalExisting)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
