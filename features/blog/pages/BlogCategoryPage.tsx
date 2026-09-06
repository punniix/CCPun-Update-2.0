import Website43Blog from "@/features/blog/website-43/Website43Blog";
import { toWebsite43ArticleItems } from "@/features/blog/website-43/blogData";
import styles from "@/components/layout/website-43/Website43.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { getContentProvider } from "@/lib/content/provider";
import { serializeJsonLd } from "@/lib/content/structured-data/serialize-json-ld";
import { buildBlogTopicHubSchema } from "@/lib/content/structured-data/article-schema";
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
  if (!hub) return { title: "บทความ | CCPun", alternates: { canonical: null }, robots: { index: false, follow: true } };

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

export default async function BlogCategoryHub({ params, searchParams }: { params: Promise<{ category: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { category: slug } = await params;
  const hub = getBlogTopicHub(slug);

  if (!hub) {
    const legacyCategoryRedirect = getLegacyCategoryRedirectPath(slug);
    if (legacyCategoryRedirect) permanentRedirect(legacyCategoryRedirect);
    const article = await getContentProvider().getArticleBySlug(slug, { includeDrafts: false });
    if (!article) notFound();
    permanentRedirect(getArticlePath(article));
  }

  const queryParams = await searchParams ?? {};
  const initialQuery = typeof queryParams.q === "string" ? queryParams.q : "";
  const articles = await getContentProvider().listArticles({ includeDrafts: false });
  const relevantArticles = articles.filter((article) => article.status === "published" && articleBelongsToHub(article, hub));
  const relevantIndexableArticles = relevantArticles.filter(isPublicIndexableArticle);
  const shouldIndexHub = hub.indexable && relevantIndexableArticles.length > 0;
  const schema = shouldIndexHub ? buildBlogTopicHubSchema(hub, relevantIndexableArticles) : null;
  const navigableHubs = BLOG_TOPIC_HUBS.filter(
    (item) => item.slug !== hub.slug
      && item.indexable
      && articles.some((article) => articleBelongsToHub(article, item) && isPublicIndexableArticle(article)),
  );

  return <>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />}
    <Website43Blog key={`${hub.slug}:${initialQuery}`} articles={toWebsite43ArticleItems(relevantArticles)} activeCategorySlug={hub.slug} initialQuery={initialQuery}
      topicContent={<section className={styles.section}><div className={styles.inner}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">หน้าแรก</Link><span aria-hidden="true"> › </span><Link href="/blog/">บทความ</Link><span aria-hidden="true"> › </span><span>{hub.title}</span></nav>
        <p className={styles.eyebrow}>{hub.eyebrow}</p><h2 className={styles.h2}>{hub.title}</h2>
        {hub.intro.map((paragraph) => <p className={styles.lead} key={paragraph}>{paragraph}</p>)}
        {!shouldIndexHub && <p className={styles.cardBody}>กำลังทยอยจัดทำบทความสำหรับหัวข้อนี้ เพื่อให้กลับมาอ่านต่อได้เป็นหมวดเดียวกันในอนาคต</p>}
      </div></section>}
      topicNavigation={<>
        {hasFeaturedLink(hub) && <section className={styles.section}><div className={styles.inner}>
          <h2 className={styles.h2}>{hub.featuredLink.title}</h2><p className={styles.lead}>{hub.featuredLink.description}</p>
          <Link href={hub.featuredLink.href} className={styles.primaryButton}>{hub.featuredLink.label}</Link>
        </div></section>}
        {navigableHubs.length > 0 && <nav className={styles.section} aria-label="สำรวจหัวข้ออื่น"><div className={styles.inner}>
          <h2 className={styles.h2}>สำรวจหัวข้ออื่น</h2><div className={styles.heroActions} style={{ flexWrap: "wrap" }}>{navigableHubs.map((item) => <Link className={styles.outlineButton} key={item.slug} href={`/blog/${item.slug}/`}>{item.title}</Link>)}</div>
        </div></nav>}
      </>}
    />
  </>;
}
