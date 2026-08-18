// =============================================
// FHC — Formatters
// Currency & number formatting utilities
// =============================================

/**
 * แสดงจำนวนเงินในรูปแบบ "฿1,500,000"
 */
export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * แสดงตัวเลขมี comma "1,500,000"
 */
export function formatNumber(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * แปลง string ที่อาจมี comma / ฿ กลับเป็น number
 * ถ้า parse ไม่ได้จะคืน 0
 */
export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
}
