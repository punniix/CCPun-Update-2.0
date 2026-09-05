import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { IS_ADMIN_APPLICATION } from "@/lib/deployment-environment";

export const metadata: Metadata = {
  title: IS_ADMIN_APPLICATION ? "ไม่พบหน้า | CCPun Control Plane" : "ไม่พบหน้า | CCPun",
  description: IS_ADMIN_APPLICATION
    ? "ไม่พบหน้าภายในพื้นที่ควบคุม CCPun"
    : "ไม่พบหน้าที่คุณกำลังหา กลับหน้าแรกหรือเลือกเครื่องมือวางแผนการเงินของ CCPun",
  alternates: { canonical: null },
  openGraph: IS_ADMIN_APPLICATION ? null : {
    title: "ไม่พบหน้า | CCPun",
    description: "ไม่พบหน้าที่คุณกำลังหา กลับหน้าแรกหรือเลือกเครื่องมือวางแผนการเงินของ CCPun",
  },
  twitter: IS_ADMIN_APPLICATION ? null : {
    title: "ไม่พบหน้า | CCPun",
    description: "ไม่พบหน้าที่คุณกำลังหา กลับหน้าแรกหรือเลือกเครื่องมือวางแผนการเงินของ CCPun",
  },
};

export default function NotFound() {
  if (IS_ADMIN_APPLICATION) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#11151a] px-5 py-16 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.05] p-7 text-center shadow-2xl md:p-9">
          <p className="text-sm font-semibold text-[#e0c985]">404</p>
          <h1 className="mt-3 text-3xl font-semibold">ไม่พบหน้าภายในพื้นที่ควบคุม</h1>
          <p className="mt-3 text-base leading-7 text-white/65">ลิงก์นี้อาจถูกย้าย หรือไม่มีอยู่ในระบบหลังบ้าน</p>
          <Link href="/snt-admin/dashboard/" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#e0c985] px-5 py-3 text-sm font-semibold text-[#17191d] transition hover:brightness-105">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า Dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isToolPage />
      <main id="main-content" tabIndex={-1} className="flex-1 px-4 pt-32 pb-20">
        <section className="max-w-2xl mx-auto text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 mb-6">
            <SearchX className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm font-semibold text-primary mb-3">404</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            ไม่พบหน้าที่คุณกำลังหา
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
            <span className="block">ลิงก์นี้อาจถูกย้าย หรือหน้านั้นไม่มีอยู่แล้ว</span>
            <span className="mt-1 block">ลองกลับไปหน้าแรก หรือเลือกเครื่องมือวางแผนจากเมนูด้านบน</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="gold-button inline-flex min-h-12 items-center gap-2 text-base">
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าแรก
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
