// =============================================
// FHC — Financial Nickname (ฉายาการเงิน)
// Classifies user into a persona based on FHN pillar scores
// =============================================

import type { FHNPillarBreakdown } from './types';

export interface FHCNickname {
  /** ชื่อฉายา */
  nickname: string;
  /** 1 ประโยคสั้น — แสดงใต้ฉายา */
  tagline: string;
  /** ข้อความ 2-3 บรรทัดสำหรับ copy แชร์ */
  shareText: string;
  /** ระดับคะแนนโดยรวม */
  tier: 'excellent' | 'good' | 'fair' | 'poor';
}

// -------------------------------------------
// Pillar level thresholds (each pillar max 25)
// H = High, M = Medium, L = Low
// -------------------------------------------
function level(score: number): 'H' | 'M' | 'L' {
  if (score >= 18) return 'H';
  if (score >= 10) return 'M';
  return 'L';
}

// -------------------------------------------
// Share text per nickname
// -------------------------------------------
const SHARE_TEXTS: Record<string, string> = {
  'ผู้พิชิตการเงิน':
    'ทั้ง 4 เสาหลักแข็งแกร่ง ไม่ใช่เรื่องบังเอิญ\nนี่คือผลของการวางแผนที่ดี\nอยากรู้ว่ายังพัฒนาต่อได้ไหม ทัก LINE @ccpun',
  'เซียนการเงิน (เกือบ)':
    'สุขภาพการเงินดีกว่าคนทั่วไปมาก\nแต่ "เกือบ" กับ "ใช่" ต่างกันในวันที่เจอเรื่องใหญ่\nอยากปิดช่องว่างที่เหลือ ทัก LINE @ccpun',
  'มือโปรไร้แผนรอง':
    'การเงินคุณแข็งแกร่งมาก\nมีจุดเดียวที่อาจทำให้ทุกอย่างสะดุด — ความคุ้มครอง\nปิดจุดอ่อนสุดท้าย ทัก LINE @ccpun',
  'นักออมจอมลืมตัวเอง':
    'ออมดีมาก วินัยเยี่ยม\nแต่ถ้าเจ็บหนักสักครั้ง เงินออมทั้งหมดอาจหายในคืนเดียว\nคุ้มครองตัวเองก่อนเงินหาย ทัก LINE @ccpun',
  'นักรบไร้เกราะ':
    'ทำงานหนัก มีวินัย เงินไม่หมดมือ\nแต่ถ้าวันหนึ่งล้มป่วยขึ้นมา ใครจะสู้แทน?\nทัก LINE @ccpun',
  'นักสะสมเป้าหมาย':
    'มีความฝัน มีแรง มีวินัยออม\nแต่ถ้าหนี้กับความเสี่ยงยังอยู่ รากอาจไม่รับน้ำหนักฝัน\nทัก LINE @ccpun',
  'ผู้พิทักษ์ครอบครัว (ยังไม่ครบ)':
    'คุณคิดถึงคนข้างหลังมาตลอด นั่นดีมาก\nแต่ถ้าหนี้ยังเกิน ความคุ้มครองอาจพาไปไม่ถึง\nทัก LINE @ccpun',
  'เศรษฐีเดือนชน':
    'เงินเดือนเข้าก็หายไปทันที ไม่ใช่เพราะใช้มาก\nแต่เพราะหนี้ไปก่อนเลย\nอยากหลุดวงจรนี้ ทัก LINE @ccpun',
  'ซุปเปอร์ฮีโร่ไม่มีฐานทัพ':
    'มีเป้าหมายชัด ใจสู้ทุกอย่าง\nแต่ถ้าเกิดเรื่องด่วน เงินฉุกเฉินพร้อมไหม?\nสร้างฐานก่อนบิน ทัก LINE @ccpun',
  'กัปตันที่ไม่มีแผนที่':
    'ไม่ได้ใช้เงินเปลือง แค่ยังไม่รู้ว่าเงินควรจะไปอยู่ที่ไหน\nวางแผนไม่ต้องทำคนเดียว ทัก LINE @ccpun',
};

// -------------------------------------------
// Nickname classification rules (priority order)
// -------------------------------------------
interface NicknameEntry {
  nickname: string;
  tagline: string;
  tier: FHCNickname['tier'];
}

function classify(
  spend: 'H' | 'M' | 'L',
  save: 'H' | 'M' | 'L',
  borrow: 'H' | 'M' | 'L',
  plan: 'H' | 'M' | 'L',
  total: number,
  hasNoLifeInsurance: boolean,
): NicknameEntry {
  // Rule 1: ทุก pillar H หรือ total >= 90 หรือ profile ดีมาก (Bug 3 fix)
  // Bug 3: high-income user มี insurance 10M แต่ HLV target สูงมาก → plan=M แม้ profile ดีมาก
  // Fix: ถ้า 3 pillars อื่น H + total >= 85 → ถือว่าเป็น ผู้พิชิตการเงิน
  if (spend === 'H' && save === 'H' && borrow === 'H' && plan === 'H') {
    return {
      nickname: 'ผู้พิชิตการเงิน',
      tagline: 'ไม่ใช่โชค แต่คือวินัย',
      tier: 'excellent',
    };
  }
  if (total >= 90) {
    return {
      nickname: 'ผู้พิชิตการเงิน',
      tagline: 'ไม่ใช่โชค แต่คือวินัย',
      tier: 'excellent',
    };
  }
  // กรณี high-achiever: 3 pillars H + plan M (เพราะ i8 เต็มแต่ HLV target สูง) + total >= 85
  if (spend === 'H' && save === 'H' && borrow === 'H' && plan === 'M' && total >= 85) {
    return {
      nickname: 'ผู้พิชิตการเงิน',
      tagline: 'ไม่ใช่โชค แต่คือวินัย',
      tier: 'excellent',
    };
  }

  // Rule 2: total 75-89 AND ไม่มี pillar L AND มีประกันชีวิต
  // Bug 2 fix: ต้องเพิ่มเงื่อนไข !hasNoLifeInsurance เพื่อกัน scenario ที่ไม่มีประกัน
  // แต่ plan=M เพราะ i8 inflate → ไม่ควรได้ "เซียนการเงิน (เกือบ)"
  if (total >= 75 && total <= 89 && spend !== 'L' && save !== 'L' && borrow !== 'L' && plan !== 'L' && !hasNoLifeInsurance) {
    return {
      nickname: 'เซียนการเงิน (เกือบ)',
      tagline: 'ไม่ได้แพ้ แต่ยังไม่ชนะสนิท',
      tier: 'good',
    };
  }

  // Rule 3: spend H AND save H AND borrow H AND plan L
  if (spend === 'H' && save === 'H' && borrow === 'H' && plan === 'L') {
    return {
      nickname: 'มือโปรไร้แผนรอง',
      tagline: '99% พร้อม แต่ 1% นั้นคือความเสี่ยงที่ใหญ่ที่สุด',
      tier: 'good',
    };
  }

  // Rule 4: save H AND (plan L หรือ ไม่มีประกันชีวิต) (ออมดีแต่ไม่มีความคุ้มครอง)
  // Bug 2 fix: hasNoLifeInsurance=true ทำให้ plan=M แทน L เพราะ i8=10 จาก investments
  // แต่ intent ของ Rule 4 คือ "ออมดีแต่ไม่ได้ซื้อประกัน" — ใช้ hasNoLifeInsurance แทน plan=L
  if (save === 'H' && (plan === 'L' || hasNoLifeInsurance)) {
    return {
      nickname: 'นักออมจอมลืมตัวเอง',
      tagline: 'ออมทุกบาทเพื่อฉุกเฉิน แต่ฉุกเฉินจริงๆ มาแล้วไม่พอ',
      tier: 'fair',
    };
  }

  // Rule 5: (plan L หรือ ไม่มีประกันชีวิต) AND spend >= M AND save >= M AND borrow >= M
  // Bug 1 fix: hasNoLifeInsurance=true แทน plan=L เนื่องจาก i8 inflates plan score
  if ((plan === 'L' || hasNoLifeInsurance) && spend !== 'L' && save !== 'L' && borrow !== 'L') {
    return {
      nickname: 'นักรบไร้เกราะ',
      tagline: 'ออกรบทุกวันแต่ลืมใส่เกราะ',
      tier: 'fair',
    };
  }

  // Rule 6: save H AND borrow L (ออมดีแต่หนี้สูง)
  if (save === 'H' && borrow === 'L') {
    return {
      nickname: 'นักสะสมเป้าหมาย',
      tagline: 'ฝันใหญ่ แต่รากยังไม่แน่น',
      tier: 'fair',
    };
  }

  // Rule 7: borrow L AND save M AND plan M (หนี้ดึงลง)
  if (borrow === 'L' && save === 'M' && plan === 'M') {
    return {
      nickname: 'ผู้พิทักษ์ครอบครัว (ยังไม่ครบ)',
      tagline: 'ปกป้องคนที่รัก แต่โล่ยังมีรู',
      tier: 'fair',
    };
  }

  // Rule 8: save L AND borrow L (ออมน้อย + หนี้เยอะ)
  if (save === 'L' && borrow === 'L') {
    return {
      nickname: 'เศรษฐีเดือนชน',
      tagline: 'เงินเยอะพอๆ กับหนี้',
      tier: 'poor',
    };
  }

  // Rule 9: spend L AND save >= M (กองฉุกเฉินน้อยแต่ออมเป้าหมายดี)
  if (spend === 'L' && save !== 'L') {
    return {
      nickname: 'ซุปเปอร์ฮีโร่ไม่มีฐานทัพ',
      tagline: 'วิ่งช่วยคนอื่นได้ แต่ถ้าตัวเองล้มก็ไม่มีที่พัก',
      tier: 'fair',
    };
  }

  // Rule 10: Fallback
  return {
    nickname: 'กัปตันที่ไม่มีแผนที่',
    tagline: 'รู้ว่าเรืออยู่ในทะเล แต่ไม่รู้จะพายไปไหน',
    tier: 'poor',
  };
}

// -------------------------------------------
// Public API
// -------------------------------------------

/**
 * @param pillars - FHN 4-pillar breakdown scores
 * @param hasNoLifeInsurance - true ถ้า lifeInsuranceSumAssured === 0
 *   ใช้แก้ Bug 1 & 2: i8 (retirement planning) inflates plan pillar score
 *   ทำให้ plan ไม่เป็น L แม้จะไม่มีประกันชีวิต
 */
export function getNickname(
  pillars: FHNPillarBreakdown,
  hasNoLifeInsurance = false,
): FHCNickname {
  const spend = level(pillars.spendScore);
  const save = level(pillars.saveScore);
  const borrow = level(pillars.borrowScore);
  const plan = level(pillars.planProtectScore);
  const total = pillars.spendScore + pillars.saveScore + pillars.borrowScore + pillars.planProtectScore;

  const entry = classify(spend, save, borrow, plan, total, hasNoLifeInsurance);

  return {
    ...entry,
    shareText: SHARE_TEXTS[entry.nickname] ?? SHARE_TEXTS['กัปตันที่ไม่มีแผนที่'],
  };
}
