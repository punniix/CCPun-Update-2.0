// =============================================
// FHC — TypeScript Interfaces
// Financial Health Check data models
// =============================================

export interface PersonalInfo {
  age: number;
  retirementAge: number; // default 60
}

export interface IncomeExpenses {
  monthlyIncome: number;
  monthlyExpenses: number;
  spouseIncome: number; // optional, default 0 — used to reduce income replacement need
}

export type DebtType = 'mortgage' | 'car' | 'personal' | 'credit_card' | 'other';

export interface DebtItem {
  type: DebtType;
  label: string;
  outstandingBalance: number;
}

export interface Debts {
  items: DebtItem[];
  totalDebt: number; // auto-calculated from items
}

export interface ChildEducation {
  costPerYear: number;      // ค่าเล่าเรียน + ค่ากินอยู่ต่อปี
  yearsRemaining: number;   // อีกกี่ปีจึงจบ
}

export interface DependentInfo {
  numberOfDependents: number;
  yearsOfSupport: number;
  numberOfChildren: number;
  educationCostPerChild: number; // auto-calculated: total / numberOfChildren
  children: ChildEducation[];    // per-child education data
}

export interface ExistingCoverage {
  lifeInsuranceSumAssured: number;
  savings: number;
  investments: number;
  hasHealthInsurance: boolean;       // toggle — มีประกันสุขภาพ
  healthInsuranceCoverage: number;   // วงเงินความคุ้มครองประกันสุขภาพ (default 0)
  hasCriticalIllness: boolean;       // toggle — มีประกันโรคร้ายแรง/ทุพพลภาพถาวร
  criticalIllnessCoverage: number;   // วงเงินความคุ้มครองโรคร้ายแรง (default 0)
  hasSocialSecurity: boolean;        // toggle — มีประกันสังคม/กองทุนสำรองเลี้ยงชีพ
  finalExpenses: number;             // ค่าจัดการสุดท้าย (default 200,000) — user-editable
  existingEmergencyFund: number;     // เงินสำรองฉุกเฉินที่มีอยู่แล้ว (default 0)
}

export interface Priorities {
  incomeProtection: number;      // 1-5 (0 = not ranked yet)
  retirementSavings: number;
  medicalExpenses: number;
  criticalIllness: number;
  childEducation: number;
}

export interface FHCFormData {
  personalInfo: PersonalInfo;
  priorities: Priorities;
  incomeExpenses: IncomeExpenses;
  debts: Debts;
  dependents: DependentInfo;
  existingCoverage: ExistingCoverage;
}

/** Legacy breakdown — kept for backward compatibility */
export interface FHCScoreBreakdown {
  coverageScore: number;    // max 40
  emergencyScore: number;   // max 20
  debtScore: number;        // max 20
  bufferScore: number;      // max 20
}

/**
 * FHN FinHealth Score — 4 Pillars breakdown
 * Based on Financial Health Network framework (finhealthnetwork.org)
 * Each pillar: max 25 points → total 100
 */
export interface FHNPillarBreakdown {
  /** Pillar 1: Spend — รายจ่าย < รายได้ + สภาพคล่องรายเดือน (max 25) */
  spendScore: number;
  /** Pillar 2: Save — เงินสำรองฉุกเฉิน + ออมระยะยาว (max 25) */
  saveScore: number;
  /** Pillar 3: Borrow — DSR + ระดับหนี้รวม (max 25) */
  borrowScore: number;
  /** Pillar 4: Plan & Protect — ความคุ้มครองประกัน + แผนระยะยาว (max 25) */
  planProtectScore: number;
}

export interface FHCResult {
  incomeReplacement: number;
  debtCoverage: number;
  educationFund: number;
  emergencyFund: number;
  finalExpenses: number;
  totalNeed: number;
  emergencyReserveUsed: number;
  savingsAvailableForProtection: number;
  totalExisting: number;
  gap: number;
  isAdequate: boolean;
  healthScore: number;
  scoreBreakdown: FHCScoreBreakdown;
  /** FHN FinHealth Score — 4 Pillars (replaces old 4-factor breakdown for UI) */
  fhnBreakdown: FHNPillarBreakdown;
}

export interface LeadData {
  name: string;
  email: string;
}
