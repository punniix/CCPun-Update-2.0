'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, MessageCircle, ShieldCheck } from 'lucide-react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { calculateCiPlanning, validateCiPlanning, type CiFormData } from '@/features/ci-planning/legacy/calculator';
import { formatBaht } from '@/lib/shared/formatters';

const INITIAL_DATA: CiFormData = {
  age: 35,
  monthlyIncome: 50000,
  monthlyExpenses: 30000,
  savings: 100000,
  healthInsuranceCoverage: 0,
  criticalIllnessCoverage: 0,
  dependents: 0,
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function formatNumberInput(value: number) {
  return value === 0 ? '' : String(value);
}

export default function CiPlanningTool() {
  const [data, setData] = useState<CiFormData>(INITIAL_DATA);

  const result = useMemo(() => calculateCiPlanning(data), [data]);
  const validation = useMemo(() => validateCiPlanning(data), [data]);

  const updateCurrency = (field: keyof CiFormData, value: number) => {
    setData((prev) => ({ ...prev, [field]: Math.max(value, 0) }));
  };

  const updateSmallNumber = (field: 'age' | 'dependents', raw: string) => {
    const value = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
    const next = Number.isNaN(value) ? 0 : value;
    setData((prev) => ({
      ...prev,
      [field]: field === 'age'
        ? clampNumber(next, 0, 80)
        : clampNumber(next, 0, 10),
    }));
  };

  const breakdown = [
    {
      label: 'เงินสำรองค่ารักษาและส่วนต่าง',
      value: result.medicalBuffer,
      note: `ฐานตามช่วงอายุ ${formatBaht(result.medicalBufferBase)} และนับประกันสุขภาพเป็นส่วนช่วยบางส่วน`,
    },
    {
      label: 'เงินทดแทนรายได้',
      value: result.incomeReplacement,
      note: `เผื่อรายได้หยุดชะงัก ${result.recoveryMonths} เดือน`,
    },
    {
      label: 'ค่าใช้จ่ายครอบครัว',
      value: result.familySupport,
      note: 'ถ้ามีคนที่พึ่งพารายได้ของคุณ ระบบเผื่อค่าใช้จ่ายครอบครัวรวม 3 เดือน',
    },
    {
      label: 'เติมเงินสำรองฉุกเฉิน',
      value: result.emergencyTopUp,
      note: 'กันเงินสำรองให้ใกล้ 6 เดือนก่อน แล้วไม่นับเงินก้อนนี้ซ้ำในยอดที่มีรองรับแล้ว',
    },
  ];
  const errorMessages = Object.values(validation.errors);

  return (
    <main id="main-content" className="flex-1 px-4 pt-6 pb-16">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-6 lg:gap-8 items-stretch">
          <section className="form-glass p-5 md:p-8 h-full" aria-label="ข้อมูลสำหรับคำนวณ">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">กรอกข้อมูลเบื้องต้น</h2>
                <p className="text-sm text-muted-foreground">ตัวเลขทั้งหมดปรับแก้ได้ตามสถานการณ์จริง</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="ci-age" className="text-sm font-medium text-foreground">อายุ</label>
                <input
                  id="ci-age"
                  inputMode="numeric"
                  value={formatNumberInput(data.age)}
                  onChange={(e) => updateSmallNumber('age', e.target.value)}
                  aria-describedby={validation.errors.age ? 'ci-age-error' : undefined}
                  className={`w-full h-12 rounded-lg bg-background/50 border px-4 text-foreground outline-none focus:border-primary/50 ${
                    validation.errors.age ? 'border-destructive' : 'border-border/50'
                  }`}
                  placeholder="35"
                />
                {validation.errors.age && (
                  <p id="ci-age-error" role="alert" className="text-destructive text-sm">{validation.errors.age}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="ci-dependents" className="text-sm font-medium text-foreground">จำนวนคนที่ดูแล</label>
                <input
                  id="ci-dependents"
                  inputMode="numeric"
                  value={formatNumberInput(data.dependents)}
                  onChange={(e) => updateSmallNumber('dependents', e.target.value)}
                  className="w-full h-12 rounded-lg bg-background/50 border border-border/50 px-4 text-foreground outline-none focus:border-primary/50"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ci-income" className="text-sm font-medium text-foreground">รายได้ต่อเดือน</label>
                <CurrencyInput
                  id="ci-income"
                  value={data.monthlyIncome}
                  onChange={(value) => updateCurrency('monthlyIncome', value)}
                  placeholder="50,000"
                  error={!!validation.errors.monthlyIncome}
                  aria-describedby={validation.errors.monthlyIncome ? 'ci-income-error' : undefined}
                />
                {validation.errors.monthlyIncome && (
                  <p id="ci-income-error" role="alert" className="text-destructive text-sm">{validation.errors.monthlyIncome}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="ci-expenses" className="text-sm font-medium text-foreground">ค่าใช้จ่ายต่อเดือน</label>
                <CurrencyInput
                  id="ci-expenses"
                  value={data.monthlyExpenses}
                  onChange={(value) => updateCurrency('monthlyExpenses', value)}
                  placeholder="30,000"
                  error={!!validation.errors.monthlyExpenses}
                  aria-describedby={validation.errors.monthlyExpenses ? 'ci-expenses-error' : undefined}
                />
                {validation.errors.monthlyExpenses && (
                  <p id="ci-expenses-error" role="alert" className="text-destructive text-sm">{validation.errors.monthlyExpenses}</p>
                )}
                {validation.warnings.cashflow && (
                  <p className="text-amber-400 text-sm">{validation.warnings.cashflow}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="ci-savings" className="text-sm font-medium text-foreground">เงินสำรองที่มี</label>
                <CurrencyInput
                  id="ci-savings"
                  value={data.savings}
                  onChange={(value) => updateCurrency('savings', value)}
                  placeholder="100,000"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ci-health" className="text-sm font-medium text-foreground">วงเงินประกันสุขภาพที่มี</label>
                <CurrencyInput
                  id="ci-health"
                  value={data.healthInsuranceCoverage}
                  onChange={(value) => updateCurrency('healthInsuranceCoverage', value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="ci-coverage" className="text-sm font-medium text-foreground">วงเงินประกันโรคร้ายแรงที่มี</label>
                <CurrencyInput
                  id="ci-coverage"
                  value={data.criticalIllnessCoverage}
                  onChange={(value) => updateCurrency('criticalIllnessCoverage', value)}
                  placeholder="0"
                />
              </div>
            </div>
          </section>

          <aside className="form-glass p-5 md:p-8 h-full flex flex-col justify-center" aria-label="ผลคำนวณ">
              {validation.isValid ? (
                <>
                  <div className="text-center py-4">
                    <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className={`text-sm font-medium mb-2 ${
                      result.gap === 0 ? 'text-green-400' : 'text-muted-foreground'
                    }`}>
                      {result.gap === 0
                        ? 'ภาพรวมดูมีรองรับค่อนข้างดีแล้ว'
                        : 'เงินก้อนที่ยังควรเตรียมเพิ่ม'}
                    </p>
                    <p className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-3 break-all sm:break-normal ${
                      result.gap === 0 ? 'text-green-400' : 'text-gold-gradient'
                    }`}>
                        {formatBaht(result.gap)}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                      ตัวเลขนี้เป็นภาพรวมเบื้องต้นของเงินก้อนโรคร้ายแรง
                      หลังหักเงินสำรองและความคุ้มครองที่มีอยู่แล้ว
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 sm:gap-6 text-sm mb-6">
                    <div className="text-center">
                      <span className="text-muted-foreground">ควรมีรวม</span>
                      <p className="font-semibold text-foreground">{formatBaht(result.totalNeed)}</p>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                    <div className="text-center">
                      <span className="text-muted-foreground">มีรองรับแล้ว</span>
                      <p className="font-semibold text-foreground">{formatBaht(result.existingProtection)}</p>
                    </div>
                  </div>

                  <a
                    href="https://m.me/61585953063887"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gold-button w-full flex items-center justify-center gap-2 h-12 text-base font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    ทัก Inbox
                  </a>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="text-lg font-bold text-foreground">กรอกข้อมูลให้ครบเพื่อดูผลคำนวณ</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ระบบจะยังไม่แสดงตัวเลขจนกว่าข้อมูลหลักครบ เพื่อป้องกันผลลัพธ์ที่ทำให้เข้าใจผิด
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {errorMessages.map((message) => (
                      <li key={message} className="text-sm text-destructive">• {message}</li>
                    ))}
                  </ul>
                </div>
              )}
          </aside>
        </div>

        {validation.isValid && (
          <section className="form-glass p-5 md:p-6" aria-label="รายละเอียดผลคำนวณ">
            <h2 className="text-lg font-bold text-foreground mb-5">แยกเป็น 4 ส่วน</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-5">
              {breakdown.map((item) => (
                <div key={item.label} className="border-t border-border/25 pt-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground leading-relaxed">{item.label}</p>
                    <p className="text-base font-semibold text-primary">{formatBaht(item.value)}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-xl border border-primary/25 bg-primary/8 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            ผลลัพธ์นี้เป็นการคำนวณเบื้องต้น ไม่ใช่คำแนะนำเฉพาะบุคคล
            และประกันชีวิตหรือประกันสุขภาพไม่ใช่เงินฝาก ควรตรวจรายละเอียดความคุ้มครอง
            เงื่อนไข และข้อยกเว้นก่อนตัดสินใจ
          </p>
        </div>
      </div>
    </main>
  );
}
