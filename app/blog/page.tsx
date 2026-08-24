import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { draftMode } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogArchive from "@/components/Blog/BlogArchive";
import { getContentProvider } from "@/lib/content/provider";

const BLOG_URL = "https://ccpun.com/blog/";
const BLOG_TITLE = "บทความการเงิน การลงทุน ประกัน และการวางแผนอนาคต | CCPun";
const BLOG_DESCRIPTION = "รวมบทความการเงิน การลงทุน ประกันชีวิต ประกันสุขภาพ ประกันโรคร้ายแรง และการวางแผนอนาคตจาก CCPun Financial Advisor";
const BLOG_OG_IMAGE = "https://ccpun.com/og-image-20260610.webp?v=68ae8d8";

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  alternates: { canonical: BLOG_URL },
  openGraph: {
    type: "website",
    url: BLOG_URL,
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    siteName: "CCPun Financial Advisor",
    locale: "th_TH",
    images: [{ url: BLOG_OG_IMAGE, width: 1200, height: 630, alt: "CCPun Financial Advisor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: [BLOG_OG_IMAGE],
  },
};

export default async function BlogPage() {
  const { isEnabled } = await draftMode();
  const cmsArticles = await getContentProvider().listArticles({ includeDrafts: isEnabled });
  const articles = cmsArticles;

  return (
    <>
      <Navbar isToolPage />
      <main id="main-content" className="min-h-screen bg-background pt-20">
        <section className="blog-hub-hero relative flex items-center justify-center overflow-hidden" aria-labelledby="blog-archive-title">
          <div className="absolute inset-0" aria-hidden="true" data-uat-role="blog-hub-background">
            <Image
              src="/assets/blog-hub-hero-ccpun-v1.webp"
              alt=""
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-[72%_center]"
            />
          </div>
          <div className="blog-hub-hero__veil absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="blog-hero__texture absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="blog-hub-hero__content relative z-10 mx-auto max-w-4xl px-4 text-center">
            <p className="blog-hub-eyebrow inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Financial Knowledge Hub</span>
            </p>
            <h1 id="blog-archive-title" className="mb-3 text-3xl font-bold leading-[1.4] text-foreground sm:mb-4 sm:text-4xl lg:text-5xl">
              บทความ
            </h1>
            <p className="blog-hub-hero__subtitle mx-auto max-w-2xl font-light text-muted-foreground">
              เคล็ดลับการเงิน การลงทุน ประกัน และการวางแผนอนาคต
            </p>
            {isEnabled && (
              <div className="mt-6 inline-flex rounded-full border border-primary/25 bg-primary/[0.07] px-4 py-2 text-sm font-medium text-primary">
                Draft Preview เปิดอยู่ — เห็นเนื้อหา UAT ที่ยังไม่เผยแพร่
              </div>
            )}
          </div>
        </section>

        <BlogArchive articles={articles} showDraft={isEnabled} />

        <section aria-labelledby="blog-hub-about" className="border-t border-white/[0.06] px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-3xl">
            <h2 id="blog-hub-about" className="text-xl font-semibold leading-snug text-foreground md:text-2xl">
              คลังความรู้สำหรับวางแผนการเงินให้เชื่อมกันทั้งความเสี่ยง การลงทุน และเป้าหมายชีวิต
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-foreground/65 md:text-base md:leading-8">
              <p>
                บทความของ CCPun รวบรวมเนื้อหาที่ใช้ประกอบการวางแผนการเงินในชีวิตจริง ตั้งแต่การจัดเงินสำรองและกระแสเงินสด การเลือกความคุ้มครองชีวิต สุขภาพ และโรคร้ายแรง ไปจนถึงการลงทุน ภาษี และการเตรียมเงินสำหรับเป้าหมายระยะยาว แต่ละเรื่องถูกจัดหมวดและหัวข้อเพื่อให้ค้นต่อได้ง่ายเมื่อคลังบทความมีจำนวนมากขึ้น
              </p>
              <p>
                เนื้อหาในคลังนี้มีวัตถุประสงค์เพื่อช่วยให้เข้าใจหลักการและคำถามสำคัญก่อนตัดสินใจ ไม่ใช่คำแนะนำเฉพาะบุคคล ผลิตภัณฑ์ประกันมีเงื่อนไขและข้อยกเว้น ส่วนการลงทุนมีความเสี่ยง จึงควรพิจารณารายได้ ภาระ เป้าหมาย ระยะเวลา และระดับความเสี่ยงของตัวเองร่วมกันก่อนเลือกแนวทางที่เหมาะสม
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
