import type { Article } from "./types";

export const TOPIC_HUB_SLUGS = [
  "personal-finance",
  "life-insurance",
  "health-insurance",
  "critical-illness",
  "investment",
] as const;

export type TopicHubSlug = (typeof TOPIC_HUB_SLUGS)[number];

export type TopicHubConfig = {
  slug: TopicHubSlug;
  title: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  intro: readonly string[];
  minimumPublishedArticlesToIndex: number;
  relatedTools?: readonly { href: string; title: string; description: string; cta: string }[];
};

const TOPIC_HUBS: Record<TopicHubSlug, TopicHubConfig> = {
  "personal-finance": {
    slug: "personal-finance",
    title: "การเงินส่วนบุคคล",
    seoTitle: "การเงินส่วนบุคคล วางรากฐานก่อนวางแผนระยะยาว | CCPun",
    description: "รวมบทความการเงินส่วนบุคคล ตั้งแต่เงินสำรอง กระแสเงินสด หนี้ ความคุ้มครอง ไปจนถึงการวางรากฐานก่อนลงทุน เพื่อให้แผนการเงินเชื่อมกันเป็นระบบ",
    eyebrow: "Personal Finance",
    intro: [
      "การวางแผนการเงินที่ดีไม่ได้เริ่มจากการเลือกผลิตภัณฑ์ แต่เริ่มจากการรู้ว่าฐานการเงินของเรารับความเสี่ยงและเป้าหมายในอนาคตได้แค่ไหน",
      "หัวข้อนี้รวบรวมแนวคิดเรื่องเงินสำรอง กระแสเงินสด หนี้ ความคุ้มครอง และลำดับการวางแผน เพื่อช่วยให้ตัดสินใจเรื่องประกันและการลงทุนบนฐานที่มั่นคงขึ้น",
    ],
    minimumPublishedArticlesToIndex: 1,
  },
  "life-insurance": {
    slug: "life-insurance",
    title: "ประกันชีวิต",
    seoTitle: "ประกันชีวิต วางแผนความคุ้มครองให้เหมาะกับเป้าหมาย | CCPun",
    description: "รวมบทความประกันชีวิตเพื่อวางแผนความคุ้มครอง รายได้ ครอบครัว และเป้าหมายระยะยาว พร้อมแนวคิดที่ช่วยแยกบทบาทของประกันออกจากการลงทุนให้ชัดเจน",
    eyebrow: "Life Insurance",
    intro: [
      "ประกันชีวิตมีหน้าที่หลักในการรับมือผลกระทบทางการเงินเมื่อชีวิตไม่เป็นไปตามแผน โดยเฉพาะเมื่อมีคนที่พึ่งพารายได้ ภาระหนี้ หรือเป้าหมายที่ต้องดำเนินต่อแม้ผู้หาเงินหลักจะไม่อยู่",
      "บทความในหัวข้อนี้เน้นการมองความคุ้มครองให้สัมพันธ์กับกระแสเงินสด ภาระ และเป้าหมาย ไม่ได้มองจากชื่อแบบประกันเพียงอย่างเดียว",
    ],
    minimumPublishedArticlesToIndex: 1,
  },
  "health-insurance": {
    slug: "health-insurance",
    title: "ประกันสุขภาพ",
    seoTitle: "ประกันสุขภาพ เลือกแผนและเข้าใจความคุ้มครอง | CCPun",
    description: "รวมบทความประกันสุขภาพ วิธีอ่านความคุ้มครอง IPD OPD วงเงิน เงื่อนไข และแนวคิดเลือกแผนให้สัมพันธ์กับสวัสดิการ งบประมาณ และความเสี่ยงของตัวเอง",
    eyebrow: "Health Insurance",
    intro: [
      "ประกันสุขภาพไม่ได้มีคำตอบเดียวว่าแผนไหนดีที่สุด เพราะความเหมาะสมขึ้นอยู่กับสวัสดิการเดิม โรงพยาบาลที่ใช้ งบประมาณ รูปแบบค่าใช้จ่าย และความเสี่ยงที่ต้องการโอนออก",
      "หัวข้อนี้รวบรวมบทความที่ช่วยอ่านความคุ้มครองและเปรียบเทียบประเด็นสำคัญก่อนตัดสินใจ โดยแยกจากเรื่องประกันชีวิตเพื่อให้ค้นข้อมูลตามเจตนาการค้นหาได้ชัดขึ้น",
    ],
    minimumPublishedArticlesToIndex: 1,
  },
  "critical-illness": {
    slug: "critical-illness",
    title: "ประกันโรคร้ายแรง",
    seoTitle: "ประกันโรคร้ายแรง วางแผนเงินก้อนเมื่อเจ็บป่วย | CCPun",
    description: "รวมความรู้ประกันโรคร้ายแรง การวางแผนเงินก้อนเมื่อรายได้สะดุด ค่าใช้จ่ายนอกเหนือจากค่ารักษา และเครื่องมือช่วยประเมินทุนคุ้มครองที่เหมาะสม",
    eyebrow: "Critical Illness",
    intro: [
      "ความเสี่ยงจากโรคร้ายแรงไม่ได้มีเฉพาะค่ารักษาพยาบาล แต่อาจกระทบรายได้ เงินสำรอง ภาระหนี้ และค่าใช้จ่ายของครอบครัวในช่วงที่ต้องพักรักษาตัว",
      "หัวข้อนี้จึงเน้นทั้งความเข้าใจรูปแบบความคุ้มครองและการวางแผนเงินก้อนที่ควรมี เพื่อเชื่อมจากความรู้ไปสู่การคำนวณความต้องการของตัวเองได้จริง",
    ],
    minimumPublishedArticlesToIndex: 1,
    relatedTools: [
      {
        href: "/ci-planning/",
        title: "CI Planning — วางแผนทุนประกันโรคร้ายแรง",
        description: "ลองประเมินช่องว่างเงินก้อนจากรายได้ ค่าใช้จ่าย ภาระ และความคุ้มครองที่มีอยู่ เพื่อใช้เป็นจุดเริ่มต้นในการวางแผน",
        cta: "ลองใช้ CI Planning",
      },
    ],
  },
  investment: {
    slug: "investment",
    title: "การลงทุน",
    seoTitle: "การลงทุน วางแผนพอร์ตให้สัมพันธ์กับเป้าหมาย | CCPun",
    description: "ศูนย์รวมบทความการลงทุนของ CCPun สำหรับทำความเข้าใจเป้าหมาย ระยะเวลา ความเสี่ยง และการจัดพอร์ตอย่างเป็นระบบ",
    eyebrow: "Investment Planning",
    intro: [
      "การลงทุนควรเริ่มจากเป้าหมาย ระยะเวลา สภาพคล่อง และความเสี่ยงที่รับได้ ก่อนเลือกสินทรัพย์หรือผลิตภัณฑ์",
      "หน้านี้เตรียมไว้เป็นศูนย์รวมเนื้อหาการลงทุนของ CCPun และจะเปิดให้ Search Engine ทำดัชนีเมื่อมีบทความที่ให้ข้อมูลเพียงพอแล้ว",
    ],
    minimumPublishedArticlesToIndex: 1,
  },
};

const ARTICLE_SEMANTIC_TOPIC_OVERRIDES: Record<string, TopicHubSlug> = {
  "aia-health-happy-describe": "health-insurance",
  "aia-health-ci-hero-guide": "health-insurance",
  "critical-illness-insurance": "critical-illness",
  "financial-pyramid": "personal-finance",
  "aia-vitality": "life-insurance",
};

const semanticTitleBySlug = new Map<TopicHubSlug, string>(
  TOPIC_HUB_SLUGS.map((slug) => [slug, TOPIC_HUBS[slug].title]),
);

export function isTopicHubSlug(value: string): value is TopicHubSlug {
  return (TOPIC_HUB_SLUGS as readonly string[]).includes(value);
}

export function getTopicHubConfig(slug: string) {
  return isTopicHubSlug(slug) ? TOPIC_HUBS[slug] : null;
}

export function getTopicHubPath(slug: TopicHubSlug) {
  return `/blog/${slug}/`;
}

export function getArticleSemanticTopicSlug(
  article: Pick<Article, "slug" | "category" | "categorySlug" | "tags">,
): TopicHubSlug {
  const override = ARTICLE_SEMANTIC_TOPIC_OVERRIDES[article.slug];
  if (override) return override;

  if (article.categorySlug === "personal-finance" || article.category === "การเงินส่วนบุคคล") {
    return "personal-finance";
  }
  if (article.categorySlug === "investment" || article.category === "การลงทุน") {
    return "investment";
  }

  const tags = new Set((article.tags ?? []).map((tag) => tag.trim().toLocaleLowerCase("th")));
  const hasHealth = tags.has("ประกันสุขภาพ");
  const hasCritical = tags.has("ประกันโรคร้ายแรง");
  if (hasHealth && !hasCritical) return "health-insurance";
  if (hasCritical && !hasHealth) return "critical-illness";

  return "life-insurance";
}

export function getArticleSemanticTopic(
  article: Pick<Article, "slug" | "category" | "categorySlug" | "tags">,
) {
  const slug = getArticleSemanticTopicSlug(article);
  return {
    slug,
    title: semanticTitleBySlug.get(slug) ?? TOPIC_HUBS[slug].title,
    path: getTopicHubPath(slug),
  };
}

export function getTopicHubArticles(
  articles: readonly Article[],
  slug: TopicHubSlug,
) {
  return articles.filter((article) => getArticleSemanticTopicSlug(article) === slug);
}

export function isTopicHubIndexable(
  slug: TopicHubSlug,
  publishedArticles: readonly Article[],
) {
  const hub = TOPIC_HUBS[slug];
  const published = getTopicHubArticles(
    publishedArticles.filter((article) => article.status === "published" && article.noindex !== true),
    slug,
  );
  return published.length >= hub.minimumPublishedArticlesToIndex;
}

export function getIndexableTopicHubs(publishedArticles: readonly Article[]) {
  return TOPIC_HUB_SLUGS
    .filter((slug) => isTopicHubIndexable(slug, publishedArticles))
    .map((slug) => TOPIC_HUBS[slug]);
}

export function getTopicHubLastModified(
  slug: TopicHubSlug,
  publishedArticles: readonly Article[],
) {
  return getTopicHubArticles(publishedArticles, slug)
    .filter((article) => article.status === "published" && article.noindex !== true)
    .map((article) => article.updatedAt)
    .sort((a, b) => b.localeCompare(a))[0];
}
