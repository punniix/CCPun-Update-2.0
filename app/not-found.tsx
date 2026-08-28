import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "ไม่พบหน้า | CCPun",
  description: "ไม่พบหน้าที่คุณกำลังหา กลับหน้าแรกหรือเลือกเครื่องมือวางแผนการเงินของ CCPun",
  alternates: { canonical: null },
  openGraph: {
    title: "ไม่พบหน้า | CCPun",
    description: "ไม่พบหน้าที่คุณกำลังหา กลับหน้าแรกหรือเลือกเครื่องมือวางแผนการเงินของ CCPun",
  },
  twitter: {
    title: "ไม่พบหน้า | CCPun",
    description: "ไม่พบหน้าที่คุณกำลังหา กลับหน้าแรกหรือเลือกเครื่องมือวางแผนการเงินของ CCPun",
  },
};

export default function NotFound() {
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
