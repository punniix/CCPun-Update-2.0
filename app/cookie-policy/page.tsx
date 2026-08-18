import type { Metadata } from "next";
import { IS_REVIEW_ENVIRONMENT } from "@/lib/deployment-environment";
import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "นโยบายคุกกี้ | CCPun ที่ปรึกษาทางการเงิน",
  description: "CCPun ใช้คุกกี้เพื่อวิเคราะห์การใช้งานเว็บไซต์ด้วย Google Analytics อ่านรายละเอียดประเภท วัตถุประสงค์ และวิธีจัดการคุกกี้",
  robots: IS_REVIEW_ENVIRONMENT ? { index: false, follow: false } : { index: true, follow: true },
  alternates: { canonical: "https://ccpun.com/cookie-policy/" },
  openGraph: {
    title: "นโยบายคุกกี้ | CCPun ที่ปรึกษาทางการเงิน",
    description: "CCPun ใช้คุกกี้เพื่อวิเคราะห์การใช้งานเว็บไซต์ด้วย Google Analytics อ่านรายละเอียดประเภท วัตถุประสงค์ และวิธีจัดการคุกกี้",
    url: "https://ccpun.com/cookie-policy/",
  },
  twitter: {
    title: "นโยบายคุกกี้ | CCPun ที่ปรึกษาทางการเงิน",
    description: "CCPun ใช้คุกกี้เพื่อวิเคราะห์การใช้งานเว็บไซต์ด้วย Google Analytics อ่านรายละเอียดประเภท วัตถุประสงค์ และวิธีจัดการคุกกี้",
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar isToolPage />
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-background px-4 pt-32 pb-16">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6 mx-auto"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Cookie className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            นโยบายคุกกี้
          </h1>
          <div className="section-divider mb-4" />
          <p className="text-muted-foreground text-sm">
            อัปเดตล่าสุด: มีนาคม 2568
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-border/40 bg-card/70 p-6 sm:p-10 space-y-10">

          {/* Intro */}
          <p className="text-foreground leading-relaxed">
            เว็บไซต์ ccpun.com ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งาน
            นโยบายนี้อธิบายว่าเราใช้คุกกี้ประเภทใด เพื่อวัตถุประสงค์อะไร
            และคุณสามารถจัดการหรือปฏิเสธคุกกี้ได้อย่างไร
          </p>

          {/* Section 1 — ประเภทคุกกี้ที่ใช้ (ตาราง 3 หมวด) */}
          <section>
            <h2 className="text-xl font-semibold text-gold-gradient mb-3">
              1. ประเภทคุกกี้ที่เราใช้
            </h2>
            <div className="section-divider mb-5" style={{ marginLeft: 0, width: "3rem" }} />

            {/* หมวด 1 — คุกกี้ที่จำเป็น */}
            <div
              className="rounded-xl p-5 mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(220,190,130,0.15)",
                    color: "hsl(45,70%,65%)",
                    border: "1px solid rgba(220,190,130,0.25)",
                  }}
                >
                  จำเป็น
                </span>
                <div>
                  <p className="text-foreground font-medium text-sm mb-1">
                    คุกกี้ที่จำเป็น (Essential Cookies)
                  </p>
                  <p className="text-muted-foreground text-[13px] md:text-sm leading-relaxed">
                    จำเป็นสำหรับการทำงานของเว็บไซต์ — ไม่สามารถปิดได้
                  </p>
                </div>
              </div>
              <table className="w-full text-[13px] md:text-sm text-muted-foreground">
                <tbody className="divide-y divide-border/20">
                  {[
                    { label: "ชื่อคุกกี้", value: "ccpun_cookie_consent" },
                    { label: "วัตถุประสงค์", value: "จำการตั้งค่าความยินยอมคุกกี้ของคุณ" },
                    { label: "ระยะเวลา", value: "1 ปี" },
                    { label: "ปิดได้", value: "ไม่ได้ — จำเป็นต่อการทำงานของเว็บไซต์" },
                  ].map(({ label, value }) => (
                    <tr key={label}>
                      <td className="py-2 pr-4 text-foreground font-medium w-36 align-top">{label}</td>
                      <td className="py-2 leading-relaxed">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* หมวด 2 — คุกกี้วิเคราะห์ */}
            <div
              className="rounded-xl p-5 mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(100,160,255,0.12)",
                    color: "hsl(210,80%,70%)",
                    border: "1px solid rgba(100,160,255,0.2)",
                  }}
                >
                  Analytics
                </span>
                <div>
                  <p className="text-foreground font-medium text-sm mb-1">
                    คุกกี้วิเคราะห์ — Google Analytics 4 (GA4)
                  </p>
                  <p className="text-muted-foreground text-[13px] md:text-sm leading-relaxed">
                    ให้บริการโดย Google LLC — เก็บข้อมูลการใช้งานในรูปแบบที่ไม่ระบุตัวตน
                  </p>
                </div>
              </div>
              <table className="w-full text-[13px] md:text-sm text-muted-foreground">
                <tbody className="divide-y divide-border/20">
                  {[
                    { label: "ชื่อคุกกี้", value: "_ga, _ga_*, _gid" },
                    { label: "วัตถุประสงค์", value: "วิเคราะห์จำนวนผู้เข้าชม พฤติกรรมการใช้งาน และหน้าที่ได้รับความสนใจ เพื่อปรับปรุงเว็บไซต์" },
                    { label: "ระยะเวลา", value: "สูงสุด 2 ปี (_ga) / 24 ชั่วโมง (_gid)" },
                    { label: "ผู้ให้บริการ", value: "Google LLC (สหรัฐอเมริกา)" },
                    { label: "ปิดได้", value: "ได้ — ค่าเริ่มต้นคือ ปิด" },
                  ].map(({ label, value }) => (
                    <tr key={label}>
                      <td className="py-2 pr-4 text-foreground font-medium w-36 align-top">{label}</td>
                      <td className="py-2 leading-relaxed">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* หมวด 3 — คุกกี้การตลาด */}
            <div
              className="rounded-xl p-5 mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(180,100,255,0.1)",
                    color: "hsl(270,70%,70%)",
                    border: "1px solid rgba(180,100,255,0.18)",
                  }}
                >
                  Marketing
                </span>
                <div>
                  <p className="text-foreground font-medium text-sm mb-1">
                    คุกกี้การตลาด (Marketing Cookies)
                  </p>
                  <p className="text-muted-foreground text-[13px] md:text-sm leading-relaxed">
                    ยังไม่เปิดใช้งาน — เตรียมไว้สำหรับการแสดงโฆษณาที่เกี่ยวข้องกับคุณในอนาคต
                  </p>
                </div>
              </div>
              <table className="w-full text-[13px] md:text-sm text-muted-foreground">
                <tbody className="divide-y divide-border/20">
                  {[
                    { label: "ชื่อคุกกี้", value: "ยังไม่มี — ยังไม่เปิดใช้งาน" },
                    { label: "วัตถุประสงค์", value: "เตรียมไว้สำหรับการแสดงโฆษณาที่ตรงกับความสนใจ หากเปิดใช้งานในอนาคต" },
                    { label: "ระยะเวลา", value: "ยังไม่มี" },
                    { label: "ผู้ให้บริการ", value: "ยังไม่มี" },
                    { label: "ปิดได้", value: "ได้ — ค่าเริ่มต้นคือ ปิด" },
                  ].map(({ label, value }) => (
                    <tr key={label}>
                      <td className="py-2 pr-4 text-foreground font-medium w-36 align-top">{label}</td>
                      <td className="py-2 leading-relaxed">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 — วัตถุประสงค์ */}
          <section>
            <h2 className="text-xl font-semibold text-gold-gradient mb-3">
              2. วัตถุประสงค์การใช้คุกกี้
            </h2>
            <div className="section-divider mb-5" style={{ marginLeft: 0, width: "3rem" }} />
            <ul className="space-y-2 text-foreground">
              {[
                "วิเคราะห์จำนวนผู้เข้าชมเว็บไซต์และแนวโน้มการเติบโต",
                "ทำความเข้าใจว่าผู้ใช้ค้นพบเว็บไซต์จากช่องทางใด",
                "ระบุหน้าที่ผู้ใช้ให้ความสนใจ เพื่อพัฒนาเนื้อหาให้ตรงความต้องการ",
                "ปรับปรุงโครงสร้างเว็บไซต์ให้ใช้งานสะดวกยิ่งขึ้น",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed mt-4">
              ข้อมูลที่ได้จาก Google Analytics เป็นข้อมูลในเชิงสถิติรวม (aggregate) และไม่สามารถระบุตัวตนผู้ใช้แต่ละคนได้
            </p>
          </section>

          {/* Section 3 — วิธีจัดการ */}
          <section>
            <h2 className="text-xl font-semibold text-gold-gradient mb-3">
              3. วิธีจัดการหรือเปลี่ยนการตั้งค่าคุกกี้
            </h2>
            <div className="section-divider mb-5" style={{ marginLeft: 0, width: "3rem" }} />
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              คุณควบคุมการใช้คุกกี้ได้ 3 วิธี:
            </p>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm mb-1">ผ่านแถบตั้งค่าคุกกี้เมื่อเข้าเว็บไซต์ครั้งแรก</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    แถบแจ้งเตือนจะปรากฏที่ด้านล่างหน้าจอ กด &ldquo;ยอมรับทั้งหมด&rdquo; &ldquo;เฉพาะที่จำเป็น&rdquo;
                    หรือกด &ldquo;ตั้งค่า&rdquo; เพื่อเลือกแต่ละประเภทได้เอง
                    การตั้งค่าจะถูกจำไว้เป็นเวลา 1 ปี
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm mb-1">ผ่านลิงก์ &ldquo;ตั้งค่าคุกกี้&rdquo; ที่ด้านล่างของเว็บไซต์</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    คุณสามารถเปลี่ยนการตั้งค่าคุกกี้ได้ตลอดเวลา โดยกดที่ลิงก์ &ldquo;ตั้งค่าคุกกี้&rdquo;
                    ที่ด้านล่างของทุกหน้าในเว็บไซต์
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm mb-1">ผ่านการตั้งค่าเบราว์เซอร์</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    คุณลบหรือบล็อกคุกกี้ได้จากการตั้งค่าเบราว์เซอร์ของคุณโดยตรง
                    เช่น Chrome: Settings &gt; Privacy and security &gt; Cookies
                    การบล็อกคุกกี้ทั้งหมดอาจส่งผลให้บางส่วนของเว็บไซต์ทำงานได้ไม่เต็มที่
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4 — Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-gold-gradient mb-3">
              4. นโยบายความเป็นส่วนตัวของ Google
            </h2>
            <div className="section-divider mb-5" style={{ marginLeft: 0, width: "3rem" }} />
            <p className="text-muted-foreground text-sm leading-relaxed">
              ข้อมูลที่ Google Analytics รวบรวมจะถูกส่งและเก็บไว้บน server ของ Google
              ภายใต้{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-2"
              >
                นโยบายความเป็นส่วนตัวของ Google
              </a>
              {" "}เราตั้งค่า GA4 ให้ anonymize IP address
              และไม่แชร์ข้อมูลเพื่อการโฆษณาของ Google
            </p>
          </section>

          {/* Section 5 — Link to Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-gold-gradient mb-3">
              5. นโยบายความเป็นส่วนตัวของ CCPun
            </h2>
            <div className="section-divider mb-5" style={{ marginLeft: 0, width: "3rem" }} />
            <p className="text-muted-foreground text-sm leading-relaxed">
              นโยบายคุกกี้นี้เป็นส่วนหนึ่งของ{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline underline-offset-2"
              >
                นโยบายความเป็นส่วนตัว
              </Link>{" "}
              ของ CCPun ซึ่งอธิบายรายละเอียดเพิ่มเติมเกี่ยวกับการเก็บและใช้ข้อมูลส่วนบุคคล
            </p>
          </section>

        </div>

        {/* Bottom back link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>

      </div>
      </main>
      <Footer />
    </>
  );
}
