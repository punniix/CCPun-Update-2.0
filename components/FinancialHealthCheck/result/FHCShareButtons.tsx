'use client';

import { useState } from 'react';
import { Facebook, Link2, Check } from 'lucide-react';

interface FHCShareButtonsProps {
  score: number;
}

export default function FHCShareButtons({ score }: FHCShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : 'https://ccpun.com/tools/financial-health-check';
  const shareText = `คะแนนสุขภาพการเงินของฉัน ${score}/100 — ตรวจสอบของคุณได้ที่ CCPun`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

  const btnClass =
    'flex min-h-11 items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-border/50 hover:border-primary/30 hover:bg-white/5';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground">แชร์ผลให้เพื่อน</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Facebook */}
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          <Facebook className="w-4 h-4 text-[#1877F2]" />
          <span className="text-foreground">Facebook</span>
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={btnClass}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">คัดลอกลิงก์</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
