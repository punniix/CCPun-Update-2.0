// =============================================
// CI Planning — Calculator
// =============================================

import type {
  CIEducationPlan,
  CIFormData,
  CIResult,
} from './types';

/** ค่าใช้จ่ายครัวเรือน × 12 × ปีสำรอง โดยไม่รวมการศึกษา ค่างวด และยอดหนี้อื่น */
export function calcHouseholdNeed(household: number, reserveYears: number): number {
  if (!Number.isFinite(household) || household < 0) {
    throw new RangeError('household must be finite and greater than or equal to 0');
  }
  if (!Number.isInteger(reserveYears) || reserveYears < 0) {
    throw new RangeError('reserveYears must be an integer greater than or equal to 0');
  }

  return household * 12 * reserveYears;
}

/** รายได้ต่อเดือน × 12 × ปีสำรอง แสดงเป็นอีกวิธีหนึ่งโดยไม่รวมกับทุนตามรายจ่าย */
export function calcIncomeBasedNeed(monthlyIncome: number, reserveYears: number): number {
  if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
    throw new RangeError('monthlyIncome must be finite and greater than or equal to 0');
  }
  if (!Number.isInteger(reserveYears) || reserveYears < 0) {
    throw new RangeError('reserveYears must be an integer greater than or equal to 0');
  }

  return monthlyIncome * 12 * reserveYears;
}

/** รวมทุนการศึกษารายคนตามค่าใช้จ่ายต่อปี × ปีที่เหลือ */
export function calcEducationNeed(educationPlans: CIEducationPlan[]): number {
  return educationPlans.reduce((total, plan) => {
    if (!Number.isFinite(plan.annualCost) || plan.annualCost <= 0) {
      throw new RangeError('annualCost must be finite and greater than 0');
    }
    if (!Number.isInteger(plan.yearsRemaining) || plan.yearsRemaining < 1 || plan.yearsRemaining > 30) {
      throw new RangeError('yearsRemaining must be an integer between 1 and 30');
    }

    return total + plan.annualCost * plan.yearsRemaining;
  }, 0);
}

/** สำรองค่างวดเฉพาะช่วงที่สั้นกว่าระหว่างงวดคงเหลือกับช่วงปีสำรอง */
export function calcDebtNeed(
  monthlyPayment: number,
  remainingInstallments: number,
  reserveYears: number,
): number {
  if (!Number.isFinite(monthlyPayment) || monthlyPayment < 0) {
    throw new RangeError('monthlyPayment must be finite and greater than or equal to 0');
  }
  if (!Number.isInteger(remainingInstallments) || remainingInstallments < 0 || remainingInstallments > 600) {
    throw new RangeError('remainingInstallments must be an integer between 0 and 600');
  }
  if (!Number.isInteger(reserveYears) || reserveYears < 0) {
    throw new RangeError('reserveYears must be an integer greater than or equal to 0');
  }

  return monthlyPayment * Math.min(remainingInstallments, reserveYears * 12);
}

/** ยอดหนี้อื่นคงเหลือเป็นยอดรวมครั้งเดียว จึงไม่คูณช่วงเวลา */
export function calcOtherDebtNeed(otherDebtBalance: number): number {
  if (!Number.isFinite(otherDebtBalance) || otherDebtBalance < 0) {
    throw new RangeError('otherDebtBalance must be finite and greater than or equal to 0');
  }

  return otherDebtBalance;
}

/**
 * Main calculator
 */
export function calculateCI(formData: CIFormData): CIResult {
  const { expenses, existingCI } = formData;

  // Worksheet formula:
  // ค่าใช้จ่ายครัวเรือน × 12 × ปีสำรอง
  // + Σ(ค่าใช้จ่ายการศึกษาต่อปี × ปีที่เหลือรายคน)
  // + ค่างวด × min(งวดคงเหลือ, ปีสำรอง × 12)
  // + ยอดหนี้อื่นคงเหลือรวม (ครั้งเดียว)
  const effectiveReserveYears = expenses.reserveYears;
  const householdMonthly = expenses.household;
  const householdNeed = calcHouseholdNeed(householdMonthly, effectiveReserveYears);
  const educationPlans = expenses.educationPlans.map((plan) => ({ ...plan }));
  const educationNeed = calcEducationNeed(educationPlans);
  const mortgageDebtNeed = calcDebtNeed(
    expenses.mortgagePayment ?? 0,
    expenses.mortgageInstallmentsRemaining ?? 0,
    effectiveReserveYears,
  );
  const carDebtNeed = calcDebtNeed(
    expenses.carPayment ?? 0,
    expenses.carInstallmentsRemaining ?? 0,
    effectiveReserveYears,
  );
  const otherDebtBalance = calcOtherDebtNeed(expenses.otherDebtBalance ?? 0);
  const debtNeed = mortgageDebtNeed + carDebtNeed + otherDebtBalance;
  const calculatedNeed = householdNeed + educationNeed + debtNeed;
  const incomeBasedNeed = calcIncomeBasedNeed(
    expenses.monthlyIncome ?? 0,
    effectiveReserveYears,
  );

  const existingCoverage = existingCI.lumpSum ?? 0;
  const liquidAssets = existingCI.liquidAssets ?? 0;
  const availableResources = existingCoverage + liquidAssets;

  const signedGap = calculatedNeed - availableResources;
  const shortfall = Math.max(signedGap, 0);
  const surplus = Math.max(-signedGap, 0);
  const incomeSignedGap = incomeBasedNeed - availableResources;
  const incomeShortfall = Math.max(incomeSignedGap, 0);
  const incomeSurplus = Math.max(-incomeSignedGap, 0);

  return {
    householdMonthly,
    householdNeed,
    educationPlans,
    educationNeed,
    mortgageDebtNeed,
    carDebtNeed,
    otherDebtBalance,
    debtNeed,
    calculatedNeed,
    existingCoverage,
    liquidAssets,
    availableResources,
    signedGap,
    gap: shortfall,
    shortfall,
    surplus,
    incomeBasedNeed,
    incomeSignedGap,
    incomeShortfall,
    incomeSurplus,
    effectiveReserveYears,
  };
}
