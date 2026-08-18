'use client';

import { MessageCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface FHCCallToActionProps {
  gap: number;
}

export default function FHCCallToAction({ gap }: FHCCallToActionProps) {
  return (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-2">อยากรู้แผนที่เหมาะกับคุณ?</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          ตัวเลขนี้เป็นจุดเริ่มต้น — ถ้าอยากได้แผนที่ออกแบบมาเฉพาะสำหรับคุณ ปรึกษาเราได้เลย
        </p>
        {gap > 0 && (
          <p className="text-sm text-primary/90 mt-2 font-medium max-w-md mx-auto">
            มาวางแผนปิดส่วนที่ขาดไปด้วยกัน
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <a
          href="https://lin.ee/tqLCs4f"
          target="_blank"
          rel="noopener noreferrer"
          className="gold-button flex items-center gap-2 justify-center"
          onClick={() => trackEvent('fhc_contact_click', { tool_name: 'fhc', contact_channel: 'line', cta_location: 'fhc_result', surface_group: 'fhc' })}
        >
          <MessageCircle className="w-5 h-5" />
          ปรึกษาผ่าน LINE OA
        </a>
      </div>

      <p className="text-xs text-muted-foreground max-w-lg mx-auto">
        การคำนวณนี้เป็นการประเมินเบื้องต้นเท่านั้น ไม่ถือเป็นคำแนะนำทางการเงินหรือการชักชวนให้ซื้อผลิตภัณฑ์ประกันภัย ผลลัพธ์อาจแตกต่างจากความเป็นจริงขึ้นอยู่กับปัจจัยหลายประการ กรุณาปรึกษาที่ปรึกษาการเงินก่อนตัดสินใจ
      </p>
    </div>
  );
}
