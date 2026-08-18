// =============================================
// FHC — Zod Validation Schemas
// Zod v4 compatible
// =============================================

import { z } from 'zod';

export const personalInfoSchema = z.object({
  age: z.number({ message: 'กรุณากรอกอายุ' })
    .min(1, { message: 'กรุณากรอกอายุ' })
    .max(80, { message: 'อายุสูงสุด 80 ปี' }),
  retirementAge: z.number({ message: 'กรุณากรอกอายุเกษียณ' })
    .min(1, { message: 'กรุณากรอกอายุเกษียณ' })
    .max(80, { message: 'อายุเกษียณสูงสุด 80 ปี' }),
}).refine((data) => data.retirementAge > data.age, {
  message: 'อายุเกษียณต้องมากกว่าอายุปัจจุบัน',
  path: ['retirementAge'],
});

export const incomeExpensesSchema = z.object({
  monthlyIncome: z.number({ message: 'กรุณากรอกรายได้' })
    .min(1, { message: 'กรุณากรอกรายได้ต่อเดือน' }),
  monthlyExpenses: z.number({ message: 'กรุณากรอกค่าใช้จ่าย' })
    .min(1, { message: 'กรุณากรอกค่าใช้จ่ายต่อเดือน' }),
});

export const debtsSchema = z.object({
  items: z.array(z.object({
    type: z.enum(['mortgage', 'car', 'personal', 'credit_card', 'other']),
    label: z.string(),
    outstandingBalance: z.number().min(0),
  })),
  totalDebt: z.number().min(0),
});

export const dependentsSchema = z.object({
  numberOfDependents: z.number({ message: 'กรุณากรอกจำนวนผู้พึ่งพิง' })
    .min(0, { message: 'จำนวนผู้พึ่งพิงต้องไม่ติดลบ' })
    .max(10, { message: 'จำนวนผู้พึ่งพิงสูงสุด 10 คน' }),
  yearsOfSupport: z.number({ message: 'กรุณากรอกจำนวนปีที่ต้องดูแล' })
    .min(0, { message: 'จำนวนปีต้องไม่ติดลบ' })
    .max(50, { message: 'จำนวนปีสูงสุด 50 ปี' }),
  numberOfChildren: z.number({ message: 'กรุณากรอกจำนวนบุตร' })
    .min(0, { message: 'จำนวนบุตรต้องไม่ติดลบ' })
    .max(10, { message: 'จำนวนบุตรสูงสุด 10 คน' }),
  educationCostPerChild: z.number({ message: 'กรุณากรอกค่าการศึกษาต่อคน' })
    .min(0, { message: 'ค่าการศึกษาต้องไม่ติดลบ' }),
  children: z.array(z.object({
    costPerYear: z.number().min(0),
    yearsRemaining: z.number().min(0),
  })).optional(),
}).refine((data) => {
  return data.numberOfDependents === 0 || data.yearsOfSupport > 0;
}, {
  message: 'กรุณากรอกจำนวนปีที่ต้องดูแล',
  path: ['yearsOfSupport'],
}).refine((data) => {
  if (data.numberOfChildren === 0) return true;
  const children = data.children ?? [];
  return (
    children.length === data.numberOfChildren &&
    children.every((child) => child.costPerYear > 0 && child.yearsRemaining > 0)
  );
}, {
  message: 'กรุณากรอกค่าใช้จ่ายและจำนวนปีของบุตรให้ครบ',
  path: ['children'],
});

export const existingCoverageSchema = z.object({
  lifeInsuranceSumAssured: z.number({ message: 'กรุณากรอกวงเงินคุ้มครองประกันชีวิต' })
    .min(0, { message: 'วงเงินคุ้มครองต้องไม่ติดลบ' }),
  savings: z.number({ message: 'กรุณากรอกเงินออม' })
    .min(0, { message: 'เงินออมต้องไม่ติดลบ' }),
  investments: z.number({ message: 'กรุณากรอกเงินลงทุน' })
    .min(0, { message: 'เงินลงทุนต้องไม่ติดลบ' }),
  existingEmergencyFund: z.number()
    .min(0, { message: 'เงินสำรองฉุกเฉินต้องไม่ติดลบ' })
    .optional(),
}).refine((data) => {
  return (data.existingEmergencyFund ?? 0) <= data.savings;
}, {
  message: 'เงินสำรองฉุกเฉินต้องไม่มากกว่าเงินออมที่กรอกด้านบน',
  path: ['existingEmergencyFund'],
});

// Priorities — require at least 3 ranked
const prioritiesSchema = z.object({
  incomeProtection: z.number(),
  retirementSavings: z.number(),
  medicalExpenses: z.number(),
  criticalIllness: z.number(),
  childEducation: z.number(),
}).refine((data) => {
  const ranked = Object.values(data).filter((v) => v > 0).length;
  return ranked >= 3;
}, { message: 'กรุณาเลือกอย่างน้อย 3 ข้อ', path: ['priorities'] });

/** Validate ข้อมูลตาม step ปัจจุบัน (0-indexed) */
export function validateStep(step: number, data: Record<string, unknown>): Record<string, string> {
  const schemas = [
    personalInfoSchema,
    prioritiesSchema,
    incomeExpensesSchema,
    debtsSchema,
    dependentsSchema,
    existingCoverageSchema,
  ];

  const schema = schemas[step];
  if (!schema) return {};

  const result = schema.safeParse(data);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  });

  return errors;
}
