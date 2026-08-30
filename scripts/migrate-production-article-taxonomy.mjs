import assert from "node:assert/strict";
import { getCliClient } from "sanity/cli";

const PROJECT_ID = "kyfxgjnq";
const DATASET = "production";
const PERSONAL_CATEGORY_ID = "ccpun-wp-category-1";
const LIFE_CATEGORY_ID = "ccpun-wp-category-4";
const INVESTMENT_CATEGORY_ID = "ccpun-category-investment";
const LEGACY_CATEGORY_IDS = ["ccpun-wp-category-127", "ccpun-category-critical-illness"];
const CATEGORY_RULES = new Map([
  [PERSONAL_CATEGORY_ID, { categoryId: PERSONAL_CATEGORY_ID, categorySlug: "personal-finance", requiredTags: [] }],
  ["ccpun-wp-category-personal-finance", { categoryId: PERSONAL_CATEGORY_ID, categorySlug: "personal-finance", requiredTags: [] }],
  [LIFE_CATEGORY_ID, { categoryId: LIFE_CATEGORY_ID, categorySlug: "life-insurance", requiredTags: [] }],
  ["ccpun-wp-category-life-insurance", { categoryId: LIFE_CATEGORY_ID, categorySlug: "life-insurance", requiredTags: [] }],
  [INVESTMENT_CATEGORY_ID, { categoryId: INVESTMENT_CATEGORY_ID, categorySlug: "investment", requiredTags: [] }],
  ["ccpun-wp-category-investment", { categoryId: INVESTMENT_CATEGORY_ID, categorySlug: "investment", requiredTags: [] }],
  ["ccpun-wp-category-127", { categoryId: LIFE_CATEGORY_ID, categorySlug: "life-insurance", requiredTags: ["ประกันสุขภาพ"] }],
  ["ccpun-category-critical-illness", { categoryId: LIFE_CATEGORY_ID, categorySlug: "life-insurance", requiredTags: ["ประกันโรคร้ายแรง"] }],
  ["ccpun-wp-category-health-critical-illness", { categoryId: LIFE_CATEGORY_ID, categorySlug: "life-insurance", requiredTags: ["ประกันสุขภาพ", "ประกันโรคร้ายแรง"] }],
]);
const TARGETS = new Map([
  ["ccpun-wp-published-196", { slug: "aia-health-happy-describe", oldCategory: "health-insurance", requiredTags: ["ประกันสุขภาพ"] }],
  ["ccpun-wp-published-359", { slug: "aia-health-ci-hero-guide", oldCategory: "health-insurance", requiredTags: ["ประกันโรคร้ายแรง"] }],
  ["ccpun-wp-published-233", { slug: "critical-illness-insurance", oldCategory: "critical-illness", requiredTags: [] }],
]);
const DIRECT_INTERNAL_PATHS = new Map([
  ["/aia-health-ci-hero-guide/", "/blog/life-insurance/aia-health-ci-hero-guide/"],
  ["/blog/aia-health-ci-hero-guide/", "/blog/life-insurance/aia-health-ci-hero-guide/"],
  ["/blog/health-insurance/aia-health-ci-hero-guide/", "/blog/life-insurance/aia-health-ci-hero-guide/"],
  ["/aia-health-happy-describe/", "/blog/life-insurance/aia-health-happy-describe/"],
  ["/blog/aia-health-happy-describe/", "/blog/life-insurance/aia-health-happy-describe/"],
  ["/blog/health-insurance/aia-health-happy-describe/", "/blog/life-insurance/aia-health-happy-describe/"],
  ["/critical-illness-insurance/", "/blog/life-insurance/critical-illness-insurance/"],
  ["/blog/critical-illness-insurance/", "/blog/life-insurance/critical-illness-insurance/"],
  ["/blog/critical-illness/critical-illness-insurance/", "/blog/life-insurance/critical-illness-insurance/"],
  ["/financial-pyramid/", "/blog/personal-finance/financial-pyramid/"],
  ["/blog/financial-pyramid/", "/blog/personal-finance/financial-pyramid/"],
]);

function parseMode(args) {
  if (!args.length || (args.length === 1 && args[0] === "--dry-run")) return "dry-run";
  if (args.length === 1 && args[0] === "--apply-production-taxonomy") return "apply";
  throw new Error("Use --dry-run or --apply-production-taxonomy only");
}

function requireProductionNeonAuditWriter() {
  throw new Error("Refusing Production taxonomy mutation: Production Neon Admin audit writer is not configured");
}

function normalizeTags(tags, requiredTags) {
  const seen = new Set();
  return [...(Array.isArray(tags) ? tags : []), ...requiredTags].flatMap((tag) => {
    const value = String(tag).trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return [];
    seen.add(key);
    return [value];
  });
}

function rewriteInternalHref(href) {
  if (typeof href !== "string") return href;
  try {
    const url = new URL(href);
    if (url.hostname !== "ccpun.com" && url.hostname !== "blog.ccpun.com") return href;
    const destination = DIRECT_INTERNAL_PATHS.get(url.pathname);
    if (!destination) return href;
    url.protocol = "https:";
    url.hostname = "ccpun.com";
    url.port = "";
    url.pathname = destination;
    return url.href;
  } catch {
    return href;
  }
}

function rewriteBodyLinks(body) {
  let changed = 0;
  const nextBody = (Array.isArray(body) ? body : []).map((block) => {
    if (!Array.isArray(block?.markDefs)) return block;
    const markDefs = block.markDefs.map((mark) => {
      const href = rewriteInternalHref(mark?.href);
      if (href === mark?.href) return mark;
      changed += 1;
      return { ...mark, href };
    });
    return { ...block, markDefs };
  });
  return { body: nextBody, changed };
}

if (process.argv.slice(2).includes("--self-test")) {
  assert.deepEqual(normalizeTags([" A ", "a"], ["ประกันสุขภาพ"]), ["A", "ประกันสุขภาพ"]);
  assert.deepEqual(CATEGORY_RULES.get("ccpun-wp-category-health-critical-illness").requiredTags, ["ประกันสุขภาพ", "ประกันโรคร้ายแรง"]);
  assert.equal(
    rewriteInternalHref("https://blog.ccpun.com/critical-illness-insurance/?utm=test#compare"),
    "https://ccpun.com/blog/life-insurance/critical-illness-insurance/?utm=test#compare",
  );
  assert.equal(rewriteBodyLinks([{ markDefs: [{ href: "https://example.com/" }] }]).changed, 0);
  console.log("PASS production taxonomy migration self-test");
  process.exit(0);
}

function assertProductionEnvironment(client, mode) {
  const { projectId, dataset } = client.config();
  if (projectId !== PROJECT_ID || dataset !== DATASET || process.env.CCPUN_APP_ENV !== "local-production") {
    throw new Error("Refusing migration: exact Production project, dataset and local-production lane are required");
  }
  if (mode === "apply" && process.env.CCPUN_PRODUCTION_TAXONOMY_MIGRATION !== "1") {
    throw new Error("Refusing migration: explicit Production migration acknowledgement is required");
  }
}

const mode = parseMode(process.argv.slice(2));
const client = getCliClient({ apiVersion: "2026-08-23" }).withConfig({ useCdn: false, perspective: "raw" });
const publishedClient = client.withConfig({ perspective: "published" });
assertProductionEnvironment(client, mode);

const [articles, categories, rawArticles, legacyReferenceDocuments] = await Promise.all([
  publishedClient.fetch(`*[_type == "article"] | order(_id asc){
    _id,_rev,title,"slug":slug.current,tags,body,publishedAt,
    "categoryRef":category._ref,"category":category->title,"categorySlug":category->slug.current,
    "canonical":seo.canonical,"noindex":seo.noindex,"reviewStatus":review.status
  }`),
  publishedClient.fetch(`*[_type == "category"] | order(_id asc){
    _id,_rev,title,"slug":slug.current,"references":*[references(^._id)]._id
  }`),
  client.fetch(`*[_type == "article"] | order(_id asc){
    _id,_rev,title,"slug":slug.current,tags,body,publishedAt,
    "categoryRef":category._ref,"category":category->title,"categorySlug":category->slug.current,
    "canonical":seo.canonical,"noindex":seo.noindex,"reviewStatus":review.status
  }`),
  client.fetch(`*[_id in $legacyIds]{
    "categoryId":_id,"references":*[references(^._id)]{_id,_type}
  }`, { legacyIds: LEGACY_CATEGORY_IDS }),
]);

const drafts = rawArticles.filter(({ _id }) => _id.startsWith("drafts."));
const draftCount = drafts.length;
for (const article of rawArticles) {
  if (!CATEGORY_RULES.has(article.categoryRef)) throw new Error(`Refusing migration: unsupported category reference on ${article._id}`);
}

const articleById = new Map(articles.map((article) => [article._id, article]));
const expectedCategories = new Map([
  [PERSONAL_CATEGORY_ID, ["personal-finance", "การเงินส่วนบุคคล"]],
  [LIFE_CATEGORY_ID, ["life-insurance", "ประกันชีวิต"]],
  [INVESTMENT_CATEGORY_ID, ["investment", "การลงทุน"]],
]);
for (const [id, [slug, title]] of expectedCategories) {
  const category = categories.find(({ _id }) => _id === id);
  if (!category || category.slug !== slug || category.title !== title) {
    throw new Error(`Refusing migration: exact active category is unavailable for ${id}`);
  }
}
for (const [id, target] of TARGETS) {
  const article = articleById.get(id);
  if (!article || article.slug !== target.slug || !article.publishedAt || article.reviewStatus !== "approved" || article.noindex === true) {
    throw new Error(`Refusing migration: Published identity/review mismatch for ${id}`);
  }
  if (![target.oldCategory, "life-insurance"].includes(article.categorySlug)) {
    throw new Error(`Refusing migration: unexpected category for ${id}`);
  }
  if (article.canonical && article.canonical !== `https://ccpun.com/blog/life-insurance/${target.slug}/`) {
    throw new Error(`Refusing migration: explicit canonical conflict for ${id}`);
  }
}

const legacyCategories = categories.filter(({ _id }) => LEGACY_CATEGORY_IDS.includes(_id));
for (const category of legacyCategories) {
  const rawReferences = rawArticles.filter(({ categoryRef }) => categoryRef === category._id);
  if (!rawReferences.length) throw new Error(`Refusing migration: legacy category ${category._id} has no article references`);
  const referenceDocuments = legacyReferenceDocuments.find(({ categoryId }) => categoryId === category._id)?.references ?? [];
  const expectedIds = new Set(rawReferences.map(({ _id }) => _id));
  const unexpected = referenceDocuments.filter(({ _id, _type }) => _type !== "article" || !expectedIds.has(_id));
  if (unexpected.length || referenceDocuments.length !== expectedIds.size) {
    throw new Error(`Refusing migration: legacy category ${category._id} has unexpected raw references`);
  }
}

const changes = [];
for (const article of rawArticles) {
  const publishedId = article._id.replace(/^drafts\./, "");
  const target = TARGETS.get(publishedId);
  const categoryRule = CATEGORY_RULES.get(article.categoryRef);
  const set = {};
  const changedFields = [];
  if (article.categoryRef !== categoryRule.categoryId) {
    set.category = { _type: "reference", _ref: categoryRule.categoryId };
    changedFields.push("category");
  }
  const nextTags = normalizeTags(article.tags, [...categoryRule.requiredTags, ...(target?.requiredTags ?? [])]);
  if (JSON.stringify(nextTags) !== JSON.stringify(article.tags ?? [])) {
    set.tags = nextTags;
    changedFields.push("tags");
  }
  const rewritten = rewriteBodyLinks(article.body);
  if (rewritten.changed) {
    set.body = rewritten.body;
    changedFields.push("bodyLinks");
  }
  if (changedFields.length) {
    changes.push({
      id: article._id,
      revision: article._rev,
      slug: article.slug,
      changedFields,
      set,
      before: { categoryRef: article.categoryRef, categorySlug: article.categorySlug, tags: article.tags ?? [], rewrittenLinks: rewritten.changed },
      after: { categoryRef: set.category?._ref ?? article.categoryRef, categorySlug: categoryRule.categorySlug, tags: set.tags ?? article.tags ?? [], rewrittenLinks: rewritten.changed },
    });
  }
}

const categoriesToDelete = legacyCategories;
const summary = {
  mode,
  projectId: PROJECT_ID,
  dataset: DATASET,
  articleCount: articles.length,
  productionDraftCount: draftCount,
  productionDrafts: drafts.map(({ _id, title, slug, categoryRef, category, categorySlug, tags, reviewStatus, noindex }) => ({
    _id, title, slug, categoryRef, category, categorySlug, tags: tags ?? [], reviewStatus, noindex: noindex ?? false,
  })),
  changedArticles: changes.map(({ id, slug, changedFields, before, after }) => ({ id, slug, changedFields, before, after })),
  changedPublishedCount: changes.filter(({ id }) => !id.startsWith("drafts.")).length,
  changedDraftCount: changes.filter(({ id }) => id.startsWith("drafts.")).length,
  categoriesBefore: categories.map(({ _id, title, slug, references }) => ({ _id, title, slug, referenceCount: references.length })),
  categoriesDeleted: categoriesToDelete.map(({ _id, title, slug }) => ({ _id, title, slug })),
  activeCategoriesAfter: ["personal-finance", "life-insurance", "investment"],
  mutationAttempted: mode === "apply",
};

if (mode === "dry-run") {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

requireProductionNeonAuditWriter();
let transaction = client.transaction();
for (const change of changes) {
  transaction = transaction.patch(change.id, (patch) => patch.ifRevisionId(change.revision).set(change.set));
}
for (const category of categoriesToDelete) transaction = transaction.delete(category._id);
await transaction.commit({ tag: "ccpun.production.taxonomy-5-to-3" });
console.log(JSON.stringify({ ...summary, changed: changes.length, deletedCategories: categoriesToDelete.length, auditLogCreated: false }, null, 2));
