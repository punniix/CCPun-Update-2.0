'use client';

import { MessageCircle } from "lucide-react";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";

const ContactSection = () => (
  <section
    id="contact-section-top"
    aria-label="ติดต่อ CCPun"
    className="relative overflow-hidden py-16 md:py-24"
    data-uat-section="contact"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/12 to-background" aria-hidden="true" />
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: "radial-gradient(circle at 50% 36%, rgba(220,190,130,.07), transparent 38%)" }}
      aria-hidden="true"
    />

    <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium text-primary/80">พร้อมเมื่อคุณพร้อม</p>
        <h2 className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
          เริ่มต้นพูดคุยกับ CCPun
        </h2>
        <p className="mx-auto mt-4 max-w-[54ch] text-base leading-7 text-foreground/64 md:text-lg md:leading-8">
          เล่าปัญหาการเงินที่คุณกังวล แล้วจัดทำแผนการเงินที่เหมาะสมกับคุณโดยเฉพาะ
        </p>

        <div id="contact-anchor" className="mt-8" />
        <a
          href={LINE_OA_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="คุยกับ CCPun ทาง LINE OA (เปิดในแท็บใหม่)"
          className="uat-contact-cta inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#06C755] px-7 text-base font-semibold text-white transition-colors hover:bg-[#05B94E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-lg"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          คุยกับ CCPun ทาง LINE OA
        </a>
      </div>
    </div>
  </section>
);

export default ContactSection;
