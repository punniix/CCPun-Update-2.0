/**
 * AnnouncementModal — Content Configuration
 *
 * แก้ไขไฟล์นี้เพื่อเปลี่ยน content ของ popup announcement
 * ไม่ต้องแตะ AnnouncementModal.tsx
 *
 * How to change for a new campaign:
 * 1. เปลี่ยน title, description, features
 * 2. เปลี่ยน ctaPrimary.href ให้ชี้ไปหน้าที่ถูกต้อง
 * 3. เปลี่ยน leftPanel.accentLabel ถ้าต้องการ label ใหม่
 * 4. bump dismissKey ให้ต่างจากเดิม — ทำให้ modal แสดงซ้ำกับ user ที่เคย dismiss แล้ว
 */

export interface AnnouncementConfig {
  /** unique key สำหรับ localStorage — เปลี่ยนเมื่อต้องการ reset dismiss state */
  dismissKey: string;
  /** จำนวนวันที่ซ่อนหลัง dismiss */
  dismissDays: number;
  /** หน่วงเวลาก่อนแสดง popup เพื่อไม่รบกวน initial paint/Core Web Vitals */
  showDelayMs: number;
  /** ข้อความ title หลักของ modal */
  title: string;
  /** ข้อความ sub-title / hook */
  subtitle: string;
  /** คำอธิบายย่อ (1-2 ประโยค) */
  description: string;
  /** bullet points — แนะนำ 3-4 ข้อ */
  features: Array<{
    icon: string; // single emoji หรือ text symbol
    text: string;
  }>;
  /** CTA หลัก */
  ctaPrimary: {
    label: string;
    href: string;
  };
  /** Left panel visual config */
  leftPanel: {
    /** badge label เล็กๆ บน left panel */
    accentLabel: string;
    /** ชื่อเครื่องมือ/feature ขนาดใหญ่ใน left panel */
    featureName: string;
    /** tagline ใต้ feature name */
    tagline: string;
  };
}

// ─── Active Campaign Config ────────────────────────────────────────────────

const announcementConfig: AnnouncementConfig = {
  // เปลี่ยน key นี้เพื่อรีเซ็ต dismiss state (เช่น campaign-fhc-v2, campaign-ebook-q2)
  dismissKey: 'ccpun_announcement_dismissed',
  dismissDays: 7,
  showDelayMs: 7000,

  title: 'เครื่องมือตรวจสุขภาพการเงินใหม่',
  subtitle: 'รู้ฐานะการเงินตัวเองใน 5 นาที',
  description:
    'วิเคราะห์สุขภาพการเงินของคุณด้วยระบบ FHN FinHealth Score — ออกแบบมาเพื่อคนไทย ตรวจทั้งรายได้ หนี้สิน ความคุ้มครอง และเงินออม',

  features: [
    { icon: '◈', text: 'ตอบคำถาม 6 ขั้นตอน ใช้เวลาไม่ถึง 5 นาที' },
    { icon: '◈', text: 'รับ Score และ feedback เฉพาะสถานการณ์ของคุณ' },
    { icon: '◈', text: 'วิเคราะห์ 4 มิติ: รายได้ หนี้ ออม คุ้มครอง' },
    { icon: '◈', text: 'ไม่เก็บข้อมูลส่วนตัว — ทำได้ทันทีโดยไม่ต้องสมัคร' },
  ],

  ctaPrimary: {
    label: 'ลองตรวจเลยครับ',
    href: '/tools/financial-health-check/',
  },

  leftPanel: {
    accentLabel: 'เปิดให้ใช้แล้ว',
    featureName: 'FHC',
    tagline: 'Financial Health Check',
  },
};

export default announcementConfig;
