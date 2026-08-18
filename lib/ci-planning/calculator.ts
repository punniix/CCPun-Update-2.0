export type CiFormData = {
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  healthInsuranceCoverage: number;
  criticalIllnessCoverage: number;
  dependents: number;
};

export type CiPlanningResult = {
  recoveryMonths: number;
  medicalBufferBase: number;
  medicalBufferFloor: number;
  healthInsuranceCredit: number;
  medicalBuffer: number;
  incomeReplacement: number;
  familySupport: number;
  emergencyTarget: number;
  emergencySavingsUsed: number;
  emergencyTopUp: number;
  availableSavingsAfterEmergency: number;
  totalNeed: number;
  existingProtection: number;
  gap: number;
};

export type CiPlanningValidation = {
  errors: Partial<Record<keyof CiFormData, string>>;
  warnings: {
    cashflow?: string;
  };
  isValid: boolean;
};

export function validateCiPlanning(data: CiFormData): CiPlanningValidation {
  const errors: CiPlanningValidation['errors'] = {};
  const warnings: CiPlanningValidation['warnings'] = {};

  if (data.age < 1) {
    errors.age = 'กรุณากรอกอายุ';
  }

  if (data.monthlyIncome < 1) {
    errors.monthlyIncome = 'กรุณากรอกรายได้ต่อเดือน';
  }

  if (data.monthlyExpenses < 1) {
    errors.monthlyExpenses = 'กรุณากรอกค่าใช้จ่ายต่อเดือน';
  }

  if (data.monthlyIncome > 0 && data.monthlyExpenses > data.monthlyIncome) {
    warnings.cashflow = 'ค่าใช้จ่ายมากกว่ารายได้ ผลลัพธ์อาจสูงกว่าสถานการณ์ปกติ';
  }

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0,
  };
}

function getRecoveryMonths(age: number, dependents: number) {
  if (dependents > 0) return 12;
  if (age >= 55) return 12;
  if (age >= 45) return 9;
  return 6;
}

function getMedicalBufferBase(age: number) {
  if (age >= 55) return 1_500_000;
  if (age >= 45) return 1_250_000;
  return 1_000_000;
}

function getMedicalBufferFloor(age: number) {
  return age >= 55 ? 300_000 : 250_000;
}

export function calculateCiPlanning(data: CiFormData): CiPlanningResult {
  const recoveryMonths = getRecoveryMonths(data.age, data.dependents);
  const medicalBufferBase = getMedicalBufferBase(data.age);
  const medicalBufferFloor = getMedicalBufferFloor(data.age);

  // Health insurance helps, but does not remove every out-of-pocket cost.
  const healthInsuranceCredit = Math.min(data.healthInsuranceCoverage * 0.7, medicalBufferBase);
  const medicalBuffer = Math.max(
    medicalBufferBase - healthInsuranceCredit,
    medicalBufferFloor
  );

  const incomeReplacement = data.monthlyIncome * recoveryMonths;
  const familySupport = data.dependents > 0 ? data.monthlyExpenses * 3 : 0;

  const emergencyTarget = data.monthlyExpenses * 6;
  const emergencySavingsUsed = Math.min(data.savings, emergencyTarget);
  const emergencyTopUp = Math.max(emergencyTarget - emergencySavingsUsed, 0);
  const availableSavingsAfterEmergency = Math.max(data.savings - emergencySavingsUsed, 0);

  const totalNeed = medicalBuffer + incomeReplacement + familySupport + emergencyTopUp;
  const existingProtection = data.criticalIllnessCoverage + availableSavingsAfterEmergency;
  const gap = Math.max(totalNeed - existingProtection, 0);

  return {
    recoveryMonths,
    medicalBufferBase,
    medicalBufferFloor,
    healthInsuranceCredit,
    medicalBuffer,
    incomeReplacement,
    familySupport,
    emergencyTarget,
    emergencySavingsUsed,
    emergencyTopUp,
    availableSavingsAfterEmergency,
    totalNeed,
    existingProtection,
    gap,
  };
}
