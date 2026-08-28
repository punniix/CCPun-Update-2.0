import Link from "next/link";
import CookieSettingsButton from "./CookieSettingsButton";

const Footer = () => {
  return (
    <footer className="footer-gradient pt-10 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[13px] md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            <span className="text-primary font-medium">คำเตือน:</span> การลงทุนมีความเสี่ยง
            ผู้ลงทุนควรทำความเข้าใจลักษณะสินค้า เงื่อนไขผลตอบแทน และความเสี่ยงก่อนตัดสินใจลงทุน
            <br />
            ผลการดำเนินงานในอดีต มิได้เป็นสิ่งยืนยันถึงผลการดำเนินงานในอนาคต
            <br />
            ผลิตภัณฑ์ประกันไม่ใช่เงินฝาก ควรศึกษาความคุ้มครอง เงื่อนไข และข้อยกเว้นก่อนตัดสินใจ
          </p>
          <div className="mt-6 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              © {new Date().getFullYear()} CCPUN Financial Advisor. All rights reserved.
            </p>
            <span className="hidden sm:inline text-border/50 text-xs">|</span>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-[13px] text-muted-foreground hover:text-primary transition-colors"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
            <span className="hidden sm:inline text-border/50 text-xs">|</span>
            <Link
              href="/cookie-policy"
              className="inline-flex min-h-11 items-center text-[13px] text-muted-foreground hover:text-primary transition-colors"
            >
              นโยบายคุกกี้
            </Link>
            <span className="hidden sm:inline text-border/50 text-xs">|</span>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
