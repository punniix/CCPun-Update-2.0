// =============================================
// FHC — Calculator
// Client-side financial need calculation
// =============================================
//
// Scoring: FHN FinHealth Score (Financial Health Network)
// Source: finhealthnetwork.org/tools/financial-health-score/
//
// 4 Pillars × 25 points each = 100 total
//
// Pillar 1 — Spend (25 pts)
//   I1: รายจ่าย < รายได้ (Spending < Income)        15 pts
//   I2: มี surplus รายเดือน (Monthly buffer)         10 pts
//
// Pillar 2 — Save (25 pts)
//   I3: เงินสำรองฉุกเฉิน 3-6 เดือน                  15 pts
//   I4: ออมระยะยาว / ลงทุน                           10 pts
//
// Pillar 3 — Borrow (25 pts)
//   I5: DSR (Debt Service Ratio) ≤ 40%              15 pts
//   I6: ภาระหนี้รวม vs รายได้ต่อปี                    10 pts
//
// Pillar 4 — Plan & Protect (25 pts)
//   I7: ทุนประกันชีวิตเพียงพอ (HLV-based check)     15 pts
//   I8: วางแผนระยะยาว (ปีก่อนเกษียณ + ลงทุน)        10 pts
//
// =============================================

import type { FHCFormData, FHCResult, FHCScoreBreakdown, FHNPillarBreakdown, ExistingCoverage } from './types';
import { FHC_DEFAULTS } from './constants';

/**
 * คำนวณ FHN Pillar Scores จาก form data
 * Return pillarBreakdown + overall healthScore (0-100)
 */
function calculateFHNScore(data: FHCFormData): {
  fhnBreakdown: FHNPillarBreakdown;
  healthScore: number;
} {
  const { personalInfo, incomeExpenses, debts, dependents, existingCoverage } = data;

  const monthlyIncome = incomeExpenses.monthlyIncome;
  const monthlyExpenses = incomeExpenses.monthlyExpenses;
  const spouseIncome = incomeExpenses.spouseIncome ?? 0;
  const annualIncome = monthlyIncome * 12;

  // ─────────────────────────────────────────────
  // PILLAR 1: SPEND (25 pts)
  // ─────────────────────────────────────────────

  // I1: รายจ่าย < รายได้ (15 pts)
  // เต็ม = รายจ่าย ≤ 80% ของรายได้ (saving rate ≥ 20%)
  // กลาง = รายจ่าย ≤ 100% (อยู่รอดได้)
  // 0 = รายจ่าย > รายได้ (ติดลบทุกเดือน)
  let i1Score = 0;
  if (monthlyIncome > 0) {
    const spendRatio = monthlyExpenses / monthlyIncome;
    if (spendRatio <= 0.8) {
      i1Score = 15; // saving rate ≥ 20% — ดีมาก
    } else if (spendRatio <= 0.9) {
      i1Score = 11; // saving rate 10-20% — พอไปได้
    } else if (spendRatio <= 1.0) {
      i1Score = 6;  // saving rate 0-10% — ตึงมาก
    } else {
      i1Score = 0;  // รายจ่าย > รายได้ — วิกฤต
    }
  } else {
    i1Score = 0;
  }

  // I2: Monthly surplus buffer (10 pts)
  // surplus = รายได้ - รายจ่าย ต่อเดือน (เงินที่เหลือจริง)
  // เต็ม = surplus ≥ 20% ของรายได้
  // กลาง = surplus ≥ 10%
  let i2Score = 0;
  if (monthlyIncome > 0) {
    const surplus = monthlyIncome - monthlyExpenses;
    const surplusRatio = surplus / monthlyIncome;
    if (surplusRatio >= 0.2) {
      i2Score = 10;
    } else if (surplusRatio >= 0.1) {
      i2Score = 7;
    } else if (surplusRatio >= 0) {
      i2Score = 3;
    } else {
      i2Score = 0;
    }
  }

  const spendScore = i1Score + i2Score; // max 25

  // ─────────────────────────────────────────────
  // PILLAR 2: SAVE (25 pts)
  // ─────────────────────────────────────────────

  // I3: เงินสำรองฉุกเฉิน (15 pts) — target = 3-6 เดือน
  // ใช้ existingEmergencyFund ถ้ามี ไม่งั้นใช้ savings แทน liquid emergency fund
  // เต็ม = ≥ 6 เดือนค่าใช้จ่าย
  // กลาง = 3-6 เดือน
  // น้อย = 1-3 เดือน
  // 0 = < 1 เดือน
  let i3Score = 0;
  const emergencyTarget6m = monthlyExpenses * 6;
  const emergencyTarget3m = monthlyExpenses * 3;
  const emergencyTarget1m = monthlyExpenses * 1;
  const savings = existingCoverage.savings;
  const existingEmergencyFund = existingCoverage.existingEmergencyFund ?? 0;
  // ใช้ค่าที่มากกว่า: เงินสำรองฉุกเฉินที่ระบุ หรือ เงินออมทั่วไป
  const effectiveEmergencyFund = Math.max(existingEmergencyFund, savings);

  if (emergencyTarget6m > 0) {
    if (effectiveEmergencyFund >= emergencyTarget6m) {
      i3Score = 15; // ครบ 6 เดือน — ดีมาก
    } else if (effectiveEmergencyFund >= emergencyTarget3m) {
      // 3-6 เดือน — interpolate 8-14
      const ratio = (effectiveEmergencyFund - emergencyTarget3m) / (emergencyTarget6m - emergencyTarget3m);
      i3Score = Math.round(8 + ratio * 6); // 8-14
    } else if (effectiveEmergencyFund >= emergencyTarget1m) {
      // 1-3 เดือน — interpolate 3-7
      const ratio = (effectiveEmergencyFund - emergencyTarget1m) / (emergencyTarget3m - emergencyTarget1m);
      i3Score = Math.round(3 + ratio * 4); // 3-7
    } else {
      i3Score = emergencyTarget1m > 0
        ? Math.round((effectiveEmergencyFund / emergencyTarget1m) * 2)
        : 0; // 0-2
    }
  } else {
    i3Score = 15; // รายจ่าย = 0 — ไม่นับ indicator นี้
  }

  // hasSocialSecurity bonus: เพิ่ม 2 คะแนน Save pillar (I3 area) ถ้ามีประกันสังคม/กองทุน
  const hasSocialSecurity = existingCoverage.hasSocialSecurity ?? false;
  if (hasSocialSecurity) {
    i3Score = Math.min(i3Score + 2, 15);
  }

  // I4: ออมระยะยาว / ลงทุน (10 pts)
  // investments vs เป้าหมาย retirement
  // เป้า = ควรมีออมระยะยาว ≥ 3 เท่าของรายได้ต่อปี
  // hasSocialSecurity: เพิ่มคะแนนเพราะมีระบบ safety net รองรับ retirement
  let i4Score = 0;
  const longTermAssets = existingCoverage.investments; // เฉพาะ investments (ไม่รวม savings ที่นับ I3 แล้ว)
  const ltTarget = annualIncome * 3; // เป้า 3 เท่าของรายได้ต่อปี

  if (ltTarget > 0) {
    const ltRatio = Math.min(longTermAssets / ltTarget, 1);
    i4Score = Math.round(ltRatio * 10);
  } else {
    i4Score = 10;
  }

  // hasSocialSecurity bonus บน I4: มีกองทุนสำรองเลี้ยงชีพ = มีฐาน retirement แล้ว
  if (hasSocialSecurity) {
    i4Score = Math.min(i4Score + 2, 10);
  }

  const saveScore = Math.min(i3Score + i4Score, 25); // max 25

  // ─────────────────────────────────────────────
  // PILLAR 3: BORROW (25 pts)
  // ─────────────────────────────────────────────

  // I5: DSR — Debt Service Ratio (15 pts)
  // ประมาณ monthly debt payment จาก totalDebt ÷ 60 เดือน (5 ปีเฉลี่ย)
  // มาตรฐานไทย: DSR ≤ 40% ของรายได้
  let i5Score = 0;
  const estimatedMonthlyDebtPayment = debts.totalDebt > 0 ? debts.totalDebt / 60 : 0;
  const dsr = monthlyIncome > 0 ? estimatedMonthlyDebtPayment / monthlyIncome : 0;

  if (debts.totalDebt === 0) {
    i5Score = 15; // ไม่มีหนี้ — เต็ม
  } else if (dsr <= 0.3) {
    i5Score = 15; // DSR ≤ 30% — ดีมาก
  } else if (dsr <= 0.4) {
    // DSR 30-40% — interpolate 10-14
    const ratio = (0.4 - dsr) / (0.4 - 0.3);
    i5Score = Math.round(10 + ratio * 4);
  } else if (dsr <= 0.6) {
    // DSR 40-60% — interpolate 4-9
    const ratio = (0.6 - dsr) / (0.6 - 0.4);
    i5Score = Math.round(4 + ratio * 5);
  } else {
    i5Score = Math.round(Math.max(0, 4 - (dsr - 0.6) * 10)); // DSR > 60% — วิกฤต
  }

  // I6: ภาระหนี้รวม vs รายได้ต่อปี (10 pts)
  // เต็ม = totalDebt ≤ 1 เท่าของรายได้ต่อปี
  // กลาง = totalDebt 1-3 เท่า
  // 0 = totalDebt > 5 เท่าของรายได้ต่อปี
  let i6Score = 0;
  const debtToIncomeRatio = annualIncome > 0 ? debts.totalDebt / annualIncome : 0;

  if (debts.totalDebt === 0) {
    i6Score = 10;
  } else if (debtToIncomeRatio <= 1) {
    i6Score = 10;
  } else if (debtToIncomeRatio <= 3) {
    const ratio = (3 - debtToIncomeRatio) / (3 - 1);
    i6Score = Math.round(4 + ratio * 5); // 4-9
  } else if (debtToIncomeRatio <= 5) {
    const ratio = (5 - debtToIncomeRatio) / (5 - 3);
    i6Score = Math.round(ratio * 3); // 0-3
  } else {
    i6Score = 0;
  }

  const borrowScore = Math.min(i5Score + i6Score, 25); // max 25

  // ─────────────────────────────────────────────
  // PILLAR 4: PLAN & PROTECT (25 pts)
  // ─────────────────────────────────────────────

  // I7: ทุนประกันชีวิตเพียงพอ (15 pts)
  // HLV-based: เป้า = รายได้ต่อปี × ปีที่ต้องดูแล (dependents.yearsOfSupport)
  // ถ้าไม่มีผู้พึ่งพา: ใช้ Rule of Thumb = รายได้ × 10
  // spouseIncome: ลด hlvTarget เพราะครอบครัวมีรายได้อื่นรองรับ
  // healthInsurance: เพิ่ม i7Score เพราะมีความคุ้มครองเพิ่มเติม
  let i7Score = 0;
  const yearsOfSupport = dependents.yearsOfSupport > 0
    ? dependents.yearsOfSupport
    : Math.max(personalInfo.retirementAge - personalInfo.age, 0) || 10;

  // ถ้ามีรายได้คู่สมรส → ลด hlvTarget ตาม proportion
  // สมมุติว่าคู่สมรสรับภาระได้ = spouseIncome / (monthlyIncome + spouseIncome) ของค่าใช้จ่าย
  const totalHouseholdIncome = monthlyIncome + spouseIncome;
  const incomeReplacementRatio = totalHouseholdIncome > 0
    ? monthlyIncome / totalHouseholdIncome
    : 1;
  const effectiveAnnualIncome = annualIncome * incomeReplacementRatio;
  const hlvTarget = effectiveAnnualIncome * yearsOfSupport;

  const coverageAvailable = existingCoverage.lifeInsuranceSumAssured;
  const hasHealthInsurance = existingCoverage.hasHealthInsurance ?? false;
  const healthInsuranceCoverage = existingCoverage.healthInsuranceCoverage ?? 0;
  const hasCriticalIllness = (existingCoverage as ExistingCoverage).hasCriticalIllness ?? false;
  const criticalIllnessCoverage = (existingCoverage as ExistingCoverage).criticalIllnessCoverage ?? 0;

  if (hlvTarget > 0) {
    const coverageRatio = Math.min(coverageAvailable / hlvTarget, 1);
    if (coverageRatio >= 1) {
      i7Score = 15; // ครบตาม HLV
    } else if (coverageRatio >= 0.75) {
      i7Score = Math.round(11 + (coverageRatio - 0.75) / 0.25 * 3); // 11-14
    } else if (coverageRatio >= 0.5) {
      i7Score = Math.round(7 + (coverageRatio - 0.5) / 0.25 * 3);   // 7-10
    } else if (coverageRatio >= 0.25) {
      i7Score = Math.round(3 + (coverageRatio - 0.25) / 0.25 * 3);  // 3-6
    } else {
      i7Score = Math.round(coverageRatio / 0.25 * 2); // 0-2
    }
  } else {
    // ไม่มีข้อมูลรายได้ — ไม่ประเมิน
    i7Score = coverageAvailable > 0 ? 10 : 0;
  }

  // healthInsurance bonus: มีประกันสุขภาพ = +1-2 pts
  if (hasHealthInsurance) {
    const healthBonus = healthInsuranceCoverage >= 1_000_000 ? 2 : 1;
    i7Score = Math.min(i7Score + healthBonus, 15);
  }

  // criticalIllness bonus: มีประกันโรคร้ายแรง = +1-2 pts
  if (hasCriticalIllness) {
    const ciBonus = criticalIllnessCoverage >= 1_000_000 ? 2 : 1;
    i7Score = Math.min(i7Score + ciBonus, 15);
  }

  // I8: วางแผนระยะยาว (10 pts)
  // วัดจาก: (1) มีปีก่อนเกษียณเพียงพอที่จะลงมือ (2) มี investments อยู่แล้ว
  // hasSocialSecurity: เพิ่ม retirement readiness เพราะมีกองทุนรองรับ
  let i8Score = 0;
  const yearsToRetirement = Math.max(personalInfo.retirementAge - personalInfo.age, 0);
  const hasInvestments = existingCoverage.investments > 0;
  const hasSavingsPlan = existingCoverage.savings >= monthlyExpenses; // มีสำรองอย่างน้อย 1 เดือน

  if (yearsToRetirement > 20 && hasInvestments) {
    i8Score = 10; // อายุน้อย + ลงทุนแล้ว — ดีที่สุด
  } else if (yearsToRetirement > 10 && hasInvestments) {
    i8Score = 8;  // เริ่มลงทุนในเวลาที่ดี
  } else if (yearsToRetirement > 5 && (hasInvestments || hasSavingsPlan)) {
    i8Score = 5;  // มีบ้างแต่ช้าไปหน่อย
  } else if (yearsToRetirement > 0 && hasSavingsPlan) {
    i8Score = 3;  // ใกล้เกษียณแต่มีแผนบ้าง
  } else if (yearsToRetirement <= 0) {
    // เลยวัยเกษียณแล้ว — ประเมินจากสินทรัพย์
    i8Score = hasInvestments ? 7 : (hasSavingsPlan ? 4 : 1);
  } else {
    i8Score = 0; // ยังไม่มีแผนใดๆ
  }

  // hasSocialSecurity bonus บน I8: มีระบบ retirement safety net = retirement readiness ดีขึ้น
  if (hasSocialSecurity) {
    i8Score = Math.min(i8Score + 2, 10);
  }

  const planProtectScore = Math.min(i7Score + i8Score, 25); // max 25

  // ─────────────────────────────────────────────
  // OVERALL HEALTH SCORE
  // ─────────────────────────────────────────────
  const rawScore = spendScore + saveScore + borrowScore + planProtectScore;
  const healthScore = Math.min(Math.round(rawScore), 100);

  const fhnBreakdown: FHNPillarBreakdown = {
    spendScore,
    saveScore,
    borrowScore,
    planProtectScore,
  };

  return { fhnBreakdown, healthScore };
}

/**
 * คำนวณความต้องการความคุ้มครองทางการเงิน (HLV Need Analysis)
 * + FHN FinHealth Score 4 Pillars
 *
 * Source: Financial Health Network (finhealthnetwork.org)
 */
export function calculateFHC(data: FHCFormData): FHCResult {
  const { incomeExpenses, debts, dependents, existingCoverage } = data;

  // ── Need Analysis (HLV approach) ───────────────────────────────────────

  // 1. Income Replacement — ค่าใช้จ่ายที่ครอบครัวต้องการตามจำนวนปีที่ต้องดูแล
  // ถ้ามีรายได้คู่สมรส → ลด income replacement proportionally
  const annualExpenses = incomeExpenses.monthlyExpenses * 12;
  const spouseIncomeVal = incomeExpenses.spouseIncome ?? 0;
  const totalHouseholdMonthly = incomeExpenses.monthlyIncome + spouseIncomeVal;
  const incomeReplacementFactor = totalHouseholdMonthly > 0
    ? incomeExpenses.monthlyIncome / totalHouseholdMonthly
    : 1;
  const hasDependents =
    dependents.numberOfDependents > 0 ||
    dependents.numberOfChildren > 0 ||
    dependents.yearsOfSupport > 0;
  const incomeReplacement = hasDependents
    ? annualExpenses * dependents.yearsOfSupport * incomeReplacementFactor
    : incomeExpenses.monthlyIncome * 6;

  // 2. Debt Coverage — ปิดหนี้สินทั้งหมด
  const debtCoverage = debts.totalDebt;

  // 3. Education Fund — กองทุนการศึกษาบุตร (per-child)
  const childrenTotal = (dependents.children || []).reduce(
    (sum, c) => sum + c.costPerYear * c.yearsRemaining, 0
  );
  const educationFund = childrenTotal > 0
    ? childrenTotal
    : dependents.numberOfChildren * dependents.educationCostPerChild;

  // 4. Emergency Fund — เงินสำรองฉุกเฉิน 6 เดือน
  //    หักด้วย existingEmergencyFund ที่มีอยู่แล้ว (gap เท่านั้น)
  const fullEmergencyNeed = incomeExpenses.monthlyExpenses * FHC_DEFAULTS.emergencyMonths;
  const existingEmergencyFundVal = Math.min(
    existingCoverage.existingEmergencyFund ?? 0,
    existingCoverage.savings,
    fullEmergencyNeed
  );
  const emergencyFund = Math.max(fullEmergencyNeed - existingEmergencyFundVal, 0);
  const savingsAvailableForProtection = Math.max(
    existingCoverage.savings - existingEmergencyFundVal,
    0
  );

  // 5. Final Expenses — removed (COO directive: confusing for users)
  const finalExpenses = 0;

  // Total Need
  const totalNeed = incomeReplacement + debtCoverage + educationFund + emergencyFund;

  // Total Existing Coverage
  const totalExisting =
    existingCoverage.lifeInsuranceSumAssured +
    savingsAvailableForProtection +
    existingCoverage.investments;

  // Gap
  const gap = totalNeed - totalExisting;
  const isAdequate = gap <= 0;

  // ── FHN FinHealth Score ─────────────────────────────────────────────────
  const { fhnBreakdown, healthScore } = calculateFHNScore(data);

  // Legacy scoreBreakdown — kept for components that still reference it
  // Map to approximate old 4-factor breakdown from FHN pillars
  const scoreBreakdown: FHCScoreBreakdown = {
    coverageScore: Math.round(fhnBreakdown.planProtectScore * 40 / 25),
    emergencyScore: Math.round((fhnBreakdown.saveScore / 25) * 20),
    debtScore: Math.round((fhnBreakdown.borrowScore / 25) * 20),
    bufferScore: Math.round((fhnBreakdown.spendScore / 25) * 20),
  };

  return {
    incomeReplacement,
    debtCoverage,
    educationFund,
    emergencyFund,
    finalExpenses,
    totalNeed,
    emergencyReserveUsed: existingEmergencyFundVal,
    savingsAvailableForProtection,
    totalExisting,
    gap,
    isAdequate,
    healthScore,
    scoreBreakdown,
    fhnBreakdown,
  };
}
