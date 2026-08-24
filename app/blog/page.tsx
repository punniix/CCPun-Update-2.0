import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { draftMode } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogArchive from "@/components/Blog/BlogArchive";
import { getContentProvider } from "@/lib/content/provider";
import { BLOG_TOPIC_HUBS, isArticleInSemanticTopic } from "@/lib/content/taxonomy";
import { isArticleCanonicalAligned } from "@/lib/content/url";

export const metadata: Metadata = {
  title: "บทความการเงิน การลงทุน และการวางแผนอนาคต | CCPun",
  description: "เคล็ดลับการเงิน การลงทุน ประกัน และการวางแผนอนาคตจาก CCPun Financial Advisor",
  alternates: { canonical: "https://ccpun.com/blog/" },
};

export default async function BlogPage() {
  const { isEnabled } = await draftMode();
  const cmsArticles = await getContentProvider().listArticles({ includeDrafts: isEnabled });
  const articles = cmsArticles;
  const publishedIndexableArticles = articles.filter(
    (article) => article.status === "published" && article.noindex !== true && isArticleCanonicalAligned(article),
  );
  const navigableHubs = BLOG_TOPIC_HUBS.filter(
    (hub) => hub.indexable && publishedIndexableArticles.some((article) => isArticleInSemanticTopic({
      articleSlug: article.slug,
      semanticTopic: article.semanticTopic,
      categoryTitle: article.category,
      categorySlug: article.categorySlug,
      tags: article.tags,
    }, hub.slug)),
  );

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
              เคล็ดลับการเงิน การลงทุน และการวางแผนอนาคต
            </p>
            {isEnabled && (
              <div className="mt-6 inline-flex rounded-full border border-primary/25 bg-primary/[0.07] px-4 py-2 text-sm font-medium text-primary">
                Draft Preview เปิดอยู่ — เห็นเนื้อหา UAT ที่ยังไม่เผยแพร่
              </div>
            )}
          </div>
        </section>

        {navigableHubs.length > 0 && (
          <nav className="border-b border-border/30 py-5" aria-label="หัวข้อบทความหลัก">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="mb-3 text-sm font-medium text-muted-foreground">เลือกหัวข้อที่ต้องการอ่าน</p>
              <div className="hide-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
                {navigableHubs.map((hub) => (
                  <Link key={hub.slug} href={`/blog/${hub.slug}/`} className="blog-cat-pill whitespace-nowrap">
                    {hub.title}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        )}

        <BlogArchive articles={articles} showDraft={isEnabled} />
      </main>
      <Footer />
    </>
  );
}
