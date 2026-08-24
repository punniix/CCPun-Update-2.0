import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/Blog/ArticleCard";
import { getContentProvider } from "@/lib/content/provider";
import { serializeJsonLd } from "@/lib/content/json-ld";
import { buildBlogTopicHubSchema } from "@/lib/content/schema";
import type { Article } from "@/lib/content/types";
import {
  BLOG_TOPIC_HUBS,
  getBlogTopicHub,
  isArticleInSemanticTopic,
  type BlogTopicHub,
} from "@/lib/content/taxonomy";
import { getArticlePath, getLegacyCategoryRedirectPath, isArticleCanonicalAligned } from "@/lib/content/url";

const SITE_URL = "https://ccpun.com";
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/assets/blog-hub-hero-ccpun-v1.webp`;

function articleBelongsToHub(article: Article, hub: BlogTopicHub) {
  return isArticleInSemanticTopic(
    {
      articleSlug: article.slug,
      semanticTopic: article.semanticTopic,
      categoryTitle: article.category,
      categorySlug: article.categorySlug,
      tags: article.tags,
    },
    hub.slug,
  );
}

function isPublicIndexableArticle(article: Article) {
  return article.status === "published" && article.noindex !== true && isArticleCanonicalAligned(article);
}

function hasFeaturedLink(hub: BlogTopicHub): hub is BlogTopicHub & {
  featuredLink: { href: string; title: string; description: string; label: string };
} {
  return "featuredLink" in hub;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const hub = getBlogTopicHub(slug);
  if (!hub) return { title: "บทความ | CCPun", robots: { index: false, follow: true } };

  const { isEnabled } = await draftMode();
  const articles = await getContentProvider().listArticles({ includeDrafts: false });
  const relevantIndexableArticles = articles.filter(
    (article) => articleBelongsToHub(article, hub) && isPublicIndexableArticle(article),
  );
  const shouldIndexHub = hub.indexable && relevantIndexableArticles.length > 0;
  const canonical = `${SITE_URL}/blog/${hub.slug}/`;

  return {
    title: hub.seoTitle,
    description: hub.description,
    alternates: { canonical },
    robots: !isEnabled && shouldIndexHub ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "th_TH",
      url: canonical,
      title: hub.seoTitle,
      description: hub.description,
      siteName: "CCPun Financial Advisor",
      images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: hub.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: hub.seoTitle,
      description: hub.description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default async function BlogCategoryHub({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const hub = getBlogTopicHub(slug);

  if (!hub) {
    const legacyCategoryRedirect = getLegacyCategoryRedirectPath(slug);
    if (legacyCategoryRedirect) permanentRedirect(legacyCategoryRedirect);
    const { isEnabled } = await draftMode();
    const article = await getContentProvider().getArticleBySlug(slug, { includeDrafts: isEnabled });
    if (!article) notFound();
    permanentRedirect(getArticlePath(article));
  }

  const { isEnabled } = await draftMode();
  const articles = await getContentProvider().listArticles({ includeDrafts: isEnabled });
  const relevantArticles = articles.filter((article) => articleBelongsToHub(article, hub));
  const relevantIndexableArticles = relevantArticles.filter(isPublicIndexableArticle);
  const shouldIndexHub = hub.indexable && relevantIndexableArticles.length > 0;
  const schema = shouldIndexHub ? buildBlogTopicHubSchema(hub, relevantIndexableArticles) : null;
  const navigableHubs = BLOG_TOPIC_HUBS.filter(
    (item) => item.slug !== hub.slug
      && item.indexable
      && articles.some((article) => articleBelongsToHub(article, item) && isPublicIndexableArticle(article)),
  );

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />}
      <Navbar isToolPage />
      <main id="main-content" className="min-h-screen bg-background pt-20">
        <section className="border-b border-border/30 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-primary">หน้าแรก</Link>
              <span aria-hidden="true">&gt;</span>
              <Link href="/blog/" className="transition-colors hover:text-primary">บทความ</Link>
              <span aria-hidden="true">&gt;</span>
              <span className="font-medium text-foreground">{hub.title}</span>
            </nav>

            <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {hub.eyebrow}
            </p>
            <h1 className="text-3xl font-bold leading-[1.35] text-foreground sm:text-4xl md:text-5xl">{hub.title}</h1>
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-8 text-muted-foreground">
              {hub.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            {!shouldIndexHub && (
              <p className="mt-6 inline-flex rounded-full border border-border/50 bg-secondary/40 px-4 py-2 text-sm text-muted-foreground">
                กำลังทยอยจัดทำบทความสำหรับหัวข้อนี้ เพื่อให้กลับมาอ่านต่อได้เป็นหมวดเดียวกันในอนาคต
              </p>
            )}
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 md:py-14 lg:px-8" aria-labelledby="topic-articles-title">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">บทความในหัวข้อนี้</p>
                <h2 id="topic-articles-title" className="mt-1 text-2xl font-semibold text-foreground">อ่านต่อเกี่ยวกับ{hub.title}</h2>
              </div>
              <Link href="/blog/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
                ดูบทความทั้งหมด <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {relevantArticles.length ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {relevantArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} showDraft={isEnabled} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/40 bg-secondary/20 p-6 text-sm leading-7 text-muted-foreground">
                กำลังเตรียมบทความสำหรับหัวข้อนี้ เมื่อมีเนื้อหาที่ผ่านการตรวจทานแล้วจะทยอยแสดงในหน้านี้
              </div>
            )}
          </div>
        </section>

        {hasFeaturedLink(hub) && (
          <section className="px-4 pb-12 sm:px-6 md:pb-16 lg:px-8" aria-labelledby="topic-tool-title">
            <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 md:p-8">
              <p className="text-sm font-medium text-primary">จากความรู้ไปสู่การวางแผน</p>
              <h2 id="topic-tool-title" className="mt-2 text-xl font-semibold text-foreground md:text-2xl">{hub.featuredLink.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">{hub.featuredLink.description}</p>
              <Link href={hub.featuredLink.href} className="gold-button mt-5 inline-flex min-h-11 items-center gap-2 px-5 py-3 text-sm font-medium">
                {hub.featuredLink.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}

        {navigableHubs.length > 0 && (
          <section className="border-t border-border/30 px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="topic-navigation-title">
            <div className="mx-auto max-w-7xl">
              <h2 id="topic-navigation-title" className="text-lg font-semibold text-foreground">สำรวจหัวข้ออื่น</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {navigableHubs.map((item) => (
                  <Link key={item.slug} href={`/blog/${item.slug}/`} className="blog-cat-pill whitespace-nowrap">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
