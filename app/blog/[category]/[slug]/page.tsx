import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MessageCircle, RefreshCw } from "lucide-react";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleBody, { ArticleTableOfContents } from "@/components/Blog/ArticleBody";
import ArticleFaq from "@/components/Blog/ArticleFaq";
import { serializeJsonLd } from "@/lib/content/json-ld";
import { getContentProvider } from "@/lib/content/provider";
import { buildArticleSchemaGraph } from "@/lib/content/schema";
import { getArticleSemanticTopic } from "@/lib/content/taxonomy";
import { getArticleCanonical, getArticleCategorySlug, getArticlePath, getMovedArticleRedirectPath, isArticleCanonicalAligned } from "@/lib/content/url";

const LINE_OA_URL = "https://lin.ee/tqLCs4f";
const DEFAULT_SOCIAL_IMAGE = "/assets/blog-hub-hero-ccpun-v1.webp";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const { isEnabled } = await draftMode();
  const article = await getContentProvider().getArticleBySlug(slug, { includeDrafts: isEnabled });
  if (!article) {
    return {
      title: "ไม่พบหน้า | CCPun",
      robots: { index: false, follow: true },
    };
  }

  const finalCategory = getArticleCategorySlug(article);
  if (category !== finalCategory) return { robots: { index: false, follow: true } };
  const canonical = getArticleCanonical(article);
  const isDraft = article.status !== "published";
  const noindex = isDraft || article.noindex === true || !isArticleCanonicalAligned(article);

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: "th_TH",
      url: canonical,
      title: article.ogTitle || article.seoTitle,
      description: article.ogDescription || article.seoDescription,
      siteName: "CCPun Financial Advisor",
      images: [{ url: article.ogImage?.src ?? article.featuredImage?.src ?? DEFAULT_SOCIAL_IMAGE, alt: article.ogImage?.alt ?? article.featuredImage?.alt ?? "CCPun บทความวางแผนการเงิน" }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.ogTitle || article.seoTitle,
      description: article.ogDescription || article.seoDescription,
      images: [article.ogImage?.src ?? article.featuredImage?.src ?? DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const movedPath = getMovedArticleRedirectPath(category, slug);
  if (movedPath) permanentRedirect(movedPath);
  const { isEnabled } = await draftMode();
  const article = await getContentProvider().getArticleBySlug(slug, { includeDrafts: isEnabled });
  if (!article) notFound();
  if (category !== getArticleCategorySlug(article)) permanentRedirect(getArticlePath(article));

  const semanticTopic = getArticleSemanticTopic({
    articleSlug: article.slug,
    semanticTopic: article.semanticTopic,
    categoryTitle: article.category,
    categorySlug: article.categorySlug,
    tags: article.tags,
  });
  const topicName = semanticTopic?.title ?? article.category;
  const topicHref = semanticTopic ? `/blog/${semanticTopic.slug}/` : "/blog/";
  const isDraft = article.status !== "published";
  const schema = isArticleCanonicalAligned(article) ? buildArticleSchemaGraph(article) : null;

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />}
      <Navbar isToolPage />
      <main id="main-content" className="min-h-screen bg-background pt-20">
        <article className="pb-24">
          <header className="blog-article-hero relative overflow-hidden">
            <div className="blog-hero__texture absolute inset-0 pointer-events-none" aria-hidden="true" />
            <div className="blog-article-hero__content relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 items-center gap-2 text-sm">
                <Link href="/" className="whitespace-nowrap text-muted-foreground transition-colors hover:text-primary">
                  หน้าแรก
                </Link>
                <span className="text-muted-foreground/50" aria-hidden="true">&gt;</span>
                <Link href="/blog/" className="whitespace-nowrap text-muted-foreground transition-colors hover:text-primary">
                  บทความ
                </Link>
                <span className="text-muted-foreground/50" aria-hidden="true">&gt;</span>
                <Link href={topicHref} className="whitespace-nowrap text-muted-foreground transition-colors hover:text-primary">
                  {topicName}
                </Link>
                <span className="text-muted-foreground/50" aria-hidden="true">&gt;</span>
                <span className="truncate font-medium text-foreground">{article.title}</span>
              </nav>

              <h1 className="mb-6 text-3xl font-bold leading-[1.4] text-foreground sm:text-4xl md:text-5xl">
                {article.title}
              </h1>

              <div className="blog-article-meta mb-0 flex flex-col gap-4 pb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/pun.webp"
                    alt="CCPun"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border-2 border-primary/30 object-cover"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-foreground">CCPun</span>
                    <span className="text-xs text-muted-foreground">ที่ปรึกษาทางการเงิน</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {article.publishedAt && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      <span>เผยแพร่เมื่อ {formatDate(article.publishedAt)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    <span>อัปเดตล่าสุด {formatDate(article.updatedAt)}</span>
                  </span>
                  <Link href={topicHref} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15">
                    {topicName}
                  </Link>
                  {isDraft && (
                    <>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                        ฉบับร่าง Preview · noindex
                      </span>
                      <form action="/api/preview/disable/" method="post">
                        <button type="submit" className="rounded-full border border-primary/25 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                          ปิด Preview
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {article.featuredImage && (
              <figure
                className="blog-article-featured-image relative aspect-[7/3] overflow-hidden rounded-2xl"
                data-uat-role="article-featured-image"
              >
                <Image
                  src={article.featuredImage.src}
                  alt={article.featuredImage.alt}
                  fill
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
                {article.featuredImage.caption && (
                  <figcaption className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                    {article.featuredImage.caption}
                  </figcaption>
                )}
              </figure>
            )}

            <ArticleTableOfContents blocks={article.body} />
            <ArticleBody blocks={article.body} />

            {article.sources && article.sources.length > 0 && (
              <section className="mt-12 border-t border-border/30 pt-8" aria-labelledby="article-sources">
                <h2 id="article-sources" className="text-xl font-semibold text-foreground">แหล่งอ้างอิง</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {article.sources.map((source) => (
                    <li key={source.label}>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="citation-link">{source.label}</a>
                      ) : source.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ArticleFaq items={article.faq ?? []} />

            <section className="article-line-cta" aria-labelledby="article-line-cta-title">
              <p className="article-line-cta__eyebrow">คุยเรื่องแผนการเงินแบบเห็นภาพ</p>
              <h2 id="article-line-cta-title" className="article-line-cta__title">
                ยังไม่ต้องรีบตัดสินใจ ลองคุยเพื่อเรียงโจทย์ของคุณก่อนก็ได้
              </h2>
              <p className="article-line-cta__copy">
                ถ้าบทความนี้ทำให้เห็นเรื่องที่อยากวางแผนต่อ ทักมาเล่าสถานการณ์ได้ครับ เราจะช่วยชวนคิดว่าควรเริ่มดูตรงไหนก่อน
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/tools/financial-health-check/" className="glass-button inline-flex min-h-12 items-center justify-center px-5 py-3 text-sm md:text-base">
                  ทดลองตรวจสุขภาพการเงิน
                </Link>
                <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className="gold-button inline-flex min-h-12 items-center justify-center gap-2 text-sm md:text-base">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  เพิ่มเพื่อน LINE OA เพื่อคุยเรื่องแผนการเงิน
                </a>
              </div>
            </section>

            <section className="blog-author-card mt-10 flex flex-col items-center gap-6 rounded-2xl p-6 sm:flex-row">
              <Image
                src="/assets/pun.webp"
                alt="ปั้น"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border-2 border-primary/30 object-cover"
              />
              <div className="text-center sm:text-left">
                <h2 className="text-lg font-semibold text-foreground">ปั้น <span className="text-primary">(Pun)</span></h2>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  ที่ปรึกษาทางการเงิน มุ่งเน้นการอธิบายเรื่องประกัน การลงทุน และการวางแผนการเงินให้เข้าใจง่ายและนำไปใช้กับสถานการณ์จริงได้
                </p>
              </div>
            </section>

            <section className="mt-8 border-t border-border/30 pt-6">
              <p className="text-sm leading-7 text-muted-foreground">
                บทความนี้จัดทำเพื่อให้ข้อมูลทั่วไป ผลิตภัณฑ์ประกันไม่ใช่เงินฝาก และการลงทุนมีความเสี่ยง ควรศึกษาความคุ้มครอง เงื่อนไข ข้อยกเว้น และความเหมาะสมก่อนตัดสินใจ
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
