'use client';

import { useEffect, useRef, useState, type ComponentType } from "react";

const CONTACT_LOAD_EVENT = "ccpun:loadContactSection";

export function requestContactSectionLoad() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONTACT_LOAD_EVENT));
}

const ContactPlaceholder = () => (
  <section
    id="contact-section-top"
    aria-label="ติดต่อ CCPun"
    className="relative overflow-hidden py-16 md:py-24"
    data-uat-section="contact"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/12 to-background" aria-hidden="true" />
    <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-medium text-primary/80">พร้อมเมื่อคุณพร้อม</p>
      <h2 className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
        เริ่มต้นพูดคุยกับ CCPun
      </h2>
      <p className="mx-auto mt-4 max-w-[54ch] text-base leading-7 text-foreground/64 md:text-lg md:leading-8">
        เล่าปัญหาการเงินที่คุณกังวล แล้วจัดทำแผนการเงินที่เหมาะสมกับคุณโดยเฉพาะ
      </p>
      <a
        href="https://lin.ee/tqLCs4f"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="วางแผนร่วมกับ CCPun ทาง LINE OA (เปิดในแท็บใหม่)"
        className="uat-contact-cta mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-[#06C755] px-7 text-base font-semibold text-white transition-colors hover:bg-[#05B94E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-lg"
      >
        วางแผนร่วมกับ CCPun
      </a>
    </div>
  </section>
);

export default function ContactSectionGate() {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [ContactSection, setContactSection] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadContactSection = () => {
      if (ContactSection) return;
      import("./ContactSection").then((mod) => {
        if (!cancelled) setContactSection(() => mod.default);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadContactSection();
          observer.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );

    const current = placeholderRef.current;
    if (current) observer.observe(current);
    window.addEventListener(CONTACT_LOAD_EVENT, loadContactSection);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener(CONTACT_LOAD_EVENT, loadContactSection);
    };
  }, [ContactSection]);

  if (ContactSection) return <ContactSection />;

  return (
    <div ref={placeholderRef}>
      <ContactPlaceholder />
    </div>
  );
}
