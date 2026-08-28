// =============================================
// FHC — Constants & Defaults
// =============================================

import type { FHCFormData } from './types';

/** ค่าเริ่มต้นสำหรับการคำนวณ */
export const FHC_DEFAULTS = {
  retirementAge: 60,
  emergencyMonths: 6,
  finalExpenses: 200_000, // ค่า default ที่แสดงใน Step 5 — user แก้ได้
} as const;

/** ประเภทหนี้สิน */
export const DEBT_TYPES = [
  { value: 'mortgage' as const, label: 'สินเชื่อบ้าน' },
  { value: 'car' as const, label: 'สินเชื่อรถ' },
  { value: 'personal' as const, label: 'สินเชื่อส่วนบุคคล' },
  { value: 'credit_card' as const, label: 'บัตรเครดิต' },
  { value: 'other' as const, label: 'อื่นๆ' },
] as const;

/** Preset ค่าการศึกษาต่อบุตร 1 คน */
export const EDUCATION_PRESETS = [
  { label: '฿800,000', value: 800_000, desc: 'มหาวิทยาลัยรัฐ' },
  { label: '฿1,500,000', value: 1_500_000, desc: 'มหาวิทยาลัยเอกชน' },
  { label: '฿3,000,000', value: 3_000_000, desc: 'มหาวิทยาลัยนานาชาติ' },
] as const;

/** ชื่อแต่ละ step ของ wizard */
export const STEP_LABELS = [
  'ข้อมูลส่วนตัว',
  'สิ่งที่สำคัญ',
  'รายได้และค่าใช้จ่าย',
  'หนี้สินและภาระ',
  'คนที่ดูแลและการศึกษา',
  'ความคุ้มครองที่มี',
] as const;

export const PRIORITY_ITEMS = [
  { key: 'incomeProtection' as const, label: 'คุ้มครองรายได้', icon: '💼' },
  { key: 'retirementSavings' as const, label: 'เกษียณและการออม', icon: '🏖️' },
  { key: 'medicalExpenses' as const, label: 'ค่ารักษาพยาบาล', icon: '🏥' },
  { key: 'criticalIllness' as const, label: 'โรคร้ายแรงและทุพพลภาพ', icon: '🛡️' },
  { key: 'childEducation' as const, label: 'ทุนการศึกษาบุตร', icon: '🎓' },
] as const;

/** สีของแต่ละหมวดผลลัพธ์ — ใช้กับ chart / badge */
export const CATEGORY_COLORS = {
  incomeReplacement: 'hsl(45, 60%, 70%)',   // gold
  debtCoverage: 'hsl(0, 60%, 60%)',          // red
  educationFund: 'hsl(210, 60%, 60%)',       // blue
  emergencyFund: 'hsl(145, 50%, 55%)',       // green
  finalExpenses: 'hsl(280, 50%, 60%)',       // purple
} as const;

/** ค่าเริ่มต้นของ form ทั้งหมด */
export const INITIAL_FORM_DATA: FHCFormData = {
  personalInfo: {
    age: 0,
    retirementAge: 0,
  },
  priorities: {
    incomeProtection: 0,
    retirementSavings: 0,
    medicalExpenses: 0,
    criticalIllness: 0,
    childEducation: 0,
  },
  incomeExpenses: {
    monthlyIncome: 0,
    monthlyExpenses: 0,
    spouseIncome: 0,
  },
  debts: {
    items: [],
    totalDebt: 0,
  },
  dependents: {
    numberOfDependents: 0,
    yearsOfSupport: 0,
    numberOfChildren: 0,
    educationCostPerChild: 0,
    children: [],
  },
  existingCoverage: {
    lifeInsuranceSumAssured: 0,
    savings: 0,
    investments: 0,
    hasHealthInsurance: false,
    healthInsuranceCoverage: 0,
    hasCriticalIllness: false,
    criticalIllnessCoverage: 0,
    hasSocialSecurity: false,
    finalExpenses: FHC_DEFAULTS.finalExpenses,
    existingEmergencyFund: 0,
  },
};
