'use client';

/**
 * FHCLeadCapture — legacy component (preserved for reference)
 * Active lead gate is now FHCLeadGate.tsx (soft gate with skip + webhook POST)
 * This file is kept to avoid orphaned imports in case it is referenced elsewhere.
 */

import { useState } from 'react';
import { User, Mail, Loader2, Lock } from 'lucide-react';
import { z } from 'zod';
import type { LeadData } from '@/features/financial-health-check/calculator/types';

interface FHCLeadCaptureProps {
  onSubmit: (leadData: LeadData) => Promise<void>;
  isSubmitting: boolean;
}

const leadSchema = z.object({
  name: z.string().trim().min(2, 'กรุณากรอกชื่อ-นามสกุล'),
  email: z.string().trim().email('กรุณากรอกอีเมลให้ถูกต้อง'),
});

export default function FHCLeadCapture({ onSubmit, isSubmitting }: FHCLeadCaptureProps) {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — bot detection
    if (honeypot) return;

    const result = leadSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(result.data);
  };

  return (
    <div className="form-glass p-5 md:p-8">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">
            รับผลวิเคราะห์ฉบับเต็มทาง Email
          </h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          กรอกข้อมูลเพื่อดูรายละเอียดเพิ่มเติมและรับสรุปผลทาง Email
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="lead-name" className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            ชื่อ-นามสกุล <span className="text-destructive">*</span>
          </label>
          <input
            id="lead-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="ชื่อ-นามสกุล"
            maxLength={100}
            aria-describedby={errors.name ? 'lead-name-error' : undefined}
            className={`w-full h-12 px-4 rounded-lg bg-background/50 border text-foreground placeholder:text-muted-foreground text-sm outline-none transition-colors focus:border-primary/50 ${errors.name ? 'border-destructive' : 'border-border/50'}`}
          />
          {errors.name && (
            <p id="lead-name-error" role="alert" className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="lead-email" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email <span className="text-destructive">*</span>
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            maxLength={255}
            aria-describedby={errors.email ? 'lead-email-error' : undefined}
            className={`w-full h-12 px-4 rounded-lg bg-background/50 border text-foreground placeholder:text-muted-foreground text-sm outline-none transition-colors focus:border-primary/50 ${errors.email ? 'border-destructive' : 'border-border/50'}`}
          />
          {errors.email && (
            <p id="lead-email-error" role="alert" className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Honeypot — hidden from real users, catches bots */}
        <input
          type="text"
          name="website"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          aria-hidden="true"
        />

        {/* PDPA Consent */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            ฉันยินยอมให้ CCPun เก็บและใช้ข้อมูลของฉันตาม{' '}
            <a href="/privacy/" className="underline text-primary hover:text-primary/80 transition-colors">
              นโยบายความเป็นส่วนตัว
            </a>
          </span>
        </label>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !consent}
          className="gold-button w-full flex items-center justify-center gap-2 h-14 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังส่ง...
            </>
          ) : (
            'ดูผลวิเคราะห์ฉบับเต็ม'
          )}
        </button>

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground text-center">
          ข้อมูลของคุณจะถูกใช้เพื่อส่งผลวิเคราะห์เท่านั้น ไม่แชร์ให้บุคคลที่สาม
        </p>
      </form>
    </div>
  );
}
