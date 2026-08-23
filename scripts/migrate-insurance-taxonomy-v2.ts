import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";

export const INSURANCE_TAXONOMY_V2_TARGETS = [
  { slug: "aia-health-happy-describe", categorySlug: "health-insurance", categoryTitle: "ประกันสุขภาพ" },
  { slug: "aia-health-ci-hero-guide", categorySlug: "health-insurance", categoryTitle: "ประกันสุขภาพ" },
  { slug: "critical-illness-insurance", categorySlug: "critical-illness", categoryTitle: "ประกันโรคร้ายแรง" },
] as const;

type Target = (typeof INSURANCE_TAXONOMY_V2_TARGETS)[number];
export type MigrationTarget = "uat" | "production";
export type MigrationMode = "dry-run" | "apply";
type Environment = Record<string, string | undefined>;

type ParsedArgs =
  | { selfTest: true }
  | { selfTest: false; target: MigrationTarget; mode: MigrationMode };

export type RawArticle = {
  _id: string;
  _rev: string;
  _type: "article";
  slug: string;
  categoryRef?: string | null;
};

export type RawCategory = {
  _id: string;
  _type: "category";
  title?: string | null;
  slug?: string | null;
};

export type CategoryCreate = {
  _id: string;
  _type: "category";
  title: string;
  slug: { _type: "slug"; current: string };
};

export type ArticleCategoryChange = {
  id: string;
  revision: string;
  slug: string;
  beforeCategoryRef: string | null;
  beforeCategorySlug: string | null;
  afterCategoryRef: string;
  afterCategorySlug: string;
  afterCategoryTitle: string;
};

export type MigrationPlan = {
  target: MigrationTarget;
  categoriesCreated: CategoryCreate[];
  changes: ArticleCategoryChange[];
  categoryIds: Record<string, string>;
};

type PatchBuilder = {
  ifRevisionId(revision: string): PatchBuilder;
  set(fields: Record<string, unknown>): PatchBuilder;
};

type Transaction = {
  createIfNotExists(document: Record<string, unknown>): Transaction;
  patch(id: string, patch: (builder: PatchBuilder) => PatchBuilder): Transaction;
  commit(options: { tag: string }): Promise<unknown>;
};

export type TransactionClient = { transaction(): Transaction };

const CONFIG = {
  uat: {
    projectId: "ccb9lnw5",
    dataset: "uat",
    allowedAppEnvironments: new Set(["local-uat", "uat", "lab", "development"]),
  },
  production: {
    projectId: "kyfxgjnq",
    dataset: "production",
    allowedAppEnvironments: new Set(["production-migration"]),
  },
} as const;

function cleanDocumentId(id: string) {
  return id.replace(/^drafts\./, "");
}

function exactEnvironmentValue(environment: Environment, name: string, expected: string) {
  const value = environment[name]?.trim();
  if (value !== expected) throw new Error(`Refusing taxonomy V2 migration: ${name} must be exactly ${expected}`);
  return value;
}

export function validateMigrationEnvironment(target: MigrationTarget, mode: MigrationMode, environment: Environment) {
  const config = CONFIG[target];
  const appEnvironment = environment.CCPUN_APP_ENV?.trim() ?? "";
  if (!config.allowedAppEnvironments.has(appEnvironment as never)) {
    throw new Error(`Refusing taxonomy V2 migration: CCPUN_APP_ENV is not approved for ${target}`);
  }

  const projectId = exactEnvironmentValue(environment, "SANITY_API_PROJECT_ID", config.projectId);
  const dataset = exactEnvironmentValue(environment, "SANITY_API_DATASET", config.dataset);

  if (target === "production" && mode === "apply") {
    if (environment.CCPUN_TAXONOMY_V2_APPROVED?.trim() !== "1") {
      throw new Error("Refusing taxonomy V2 migration: Production approval flag is required");
    }
    if (!environment.CCPUN_TAXONOMY_V2_BACKUP_ID?.trim()) {
      throw new Error("Refusing taxonomy V2 migration: Production backup ID is required");
    }
  }

  const readToken = environment.SANITY_API_READ_TOKEN?.trim() || undefined;
  const writeToken = environment.SANITY_API_WRITE_TOKEN?.trim() || undefined;
  if (mode === "apply" && !writeToken) throw new Error("Refusing taxonomy V2 migration: write token is required for apply");
  if (mode === "dry-run" && !readToken && !writeToken) {
    throw new Error("Refusing taxonomy V2 migration: read or write token is required for dry-run");
  }

  return {
    target,
    mode,
    appEnvironment,
    projectId,
    dataset,
    readToken,
    writeToken,
    backupId: environment.CCPUN_TAXONOMY_V2_BACKUP_ID?.trim() || undefined,
  };
}

function resolveCategorySlug(categoryRef: string | null | undefined, categories: readonly RawCategory[]) {
  if (!categoryRef) return null;
  const logicalId = cleanDocumentId(categoryRef);
  const variants = categories.filter((category) => cleanDocumentId(category._id) === logicalId);
  const slugs = [...new Set(variants.map((category) => category.slug).filter((value): value is string => Boolean(value)))];
  if (slugs.length > 1) throw new Error(`Refusing taxonomy V2 migration: category ${logicalId} has conflicting slugs`);
  return slugs[0] ?? null;
}

function targetCategoryId(target: Target, categories: readonly RawCategory[]) {
  const matching = categories.filter((category) => category.slug === target.categorySlug);
  const logicalIds = [...new Set(matching.map((category) => cleanDocumentId(category._id)))];
  if (logicalIds.length > 1) {
    throw new Error(`Refusing taxonomy V2 migration: multiple ${target.categorySlug} category identities found`);
  }
  return logicalIds[0] ?? `ccpun-category-${target.categorySlug}`;
}

function hasPublishedCategory(id: string, categories: readonly RawCategory[]) {
  return categories.some((category) => category._id === id && category._type === "category");
}

export function buildInsuranceTaxonomyV2Plan(
  target: MigrationTarget,
  articles: readonly RawArticle[],
  categories: readonly RawCategory[],
): MigrationPlan {
  const seenArticleIds = new Set<string>();
  for (const article of articles) {
    if (!article._id || !article._rev || article._type !== "article" || !article.slug || seenArticleIds.has(article._id)) {
      throw new Error("Refusing taxonomy V2 migration: invalid or duplicate article document identity");
    }
    seenArticleIds.add(article._id);
  }

  const categoriesCreatedById = new Map<string, CategoryCreate>();
  const categoryIds: Record<string, string> = {};
  const changes: ArticleCategoryChange[] = [];

  for (const targetArticle of INSURANCE_TAXONOMY_V2_TARGETS) {
    const matchingArticles = articles.filter((article) => article.slug === targetArticle.slug);
    if (!matchingArticles.length) {
      throw new Error(`Refusing taxonomy V2 migration: required article slug ${targetArticle.slug} is missing`);
    }

    const logicalArticleIds = [...new Set(matchingArticles.map((article) => cleanDocumentId(article._id)))];
    if (logicalArticleIds.length > 1) {
      throw new Error(`Refusing taxonomy V2 migration: duplicate logical article for ${targetArticle.slug}`);
    }

    const categoryId = targetCategoryId(targetArticle, categories);
    categoryIds[targetArticle.categorySlug] = categoryId;
    if (!hasPublishedCategory(categoryId, categories) && !categoriesCreatedById.has(categoryId)) {
      categoriesCreatedById.set(categoryId, {
        _id: categoryId,
        _type: "category",
        title: targetArticle.categoryTitle,
        slug: { _type: "slug", current: targetArticle.categorySlug },
      });
    }

    for (const article of matchingArticles) {
      const currentCategoryRef = article.categoryRef ?? null;
      const currentCategorySlug = resolveCategorySlug(currentCategoryRef, categories);
      if (currentCategorySlug !== "life-insurance" && currentCategorySlug !== targetArticle.categorySlug) {
        throw new Error(
          `Refusing taxonomy V2 migration: ${article._id} expected life-insurance or ${targetArticle.categorySlug}, found ${currentCategorySlug ?? "none"}`,
        );
      }
      if (cleanDocumentId(currentCategoryRef ?? "") === categoryId && currentCategorySlug === targetArticle.categorySlug) continue;

      changes.push({
        id: article._id,
        revision: article._rev,
        slug: article.slug,
        beforeCategoryRef: currentCategoryRef,
        beforeCategorySlug: currentCategorySlug,
        afterCategoryRef: categoryId,
        afterCategorySlug: targetArticle.categorySlug,
        afterCategoryTitle: targetArticle.categoryTitle,
      });
    }
  }

  return { target, categoriesCreated: [...categoriesCreatedById.values()], changes, categoryIds };
}

function auditLogId(plan: MigrationPlan, backupId?: string) {
  const digest = createHash("sha256")
    .update(JSON.stringify({
      target: plan.target,
      backupId: backupId ?? null,
      categories: plan.categoriesCreated,
      changes: plan.changes.map(({ id, revision, afterCategoryRef }) => ({ id, revision, afterCategoryRef })),
    }))
    .digest("hex")
    .slice(0, 24);
  return `auditLog.taxonomy-v2-${digest}`;
}

export async function applyInsuranceTaxonomyV2Plan(
  client: TransactionClient,
  plan: MigrationPlan,
  options: { timestamp?: string; backupId?: string } = {},
) {
  if (!plan.changes.length && !plan.categoriesCreated.length) {
    return { changed: 0, categoriesCreated: 0, auditLogCreated: false };
  }

  const timestamp = options.timestamp ?? new Date().toISOString();
  let transaction = client.transaction();
  for (const category of plan.categoriesCreated) transaction = transaction.createIfNotExists(category);
  for (const change of plan.changes) {
    transaction = transaction.patch(change.id, (patch) => patch
      .ifRevisionId(change.revision)
      .set({ category: { _type: "reference", _ref: change.afterCategoryRef } }));
  }

  const before = plan.changes.map((change) => ({
    id: change.id,
    revision: change.revision,
    slug: change.slug,
    categoryRef: change.beforeCategoryRef,
    categorySlug: change.beforeCategorySlug,
  }));
  const after = plan.changes.map((change) => ({
    id: change.id,
    slug: change.slug,
    categoryRef: change.afterCategoryRef,
    categorySlug: change.afterCategorySlug,
  }));

  transaction = transaction.createIfNotExists({
    _id: auditLogId(plan, options.backupId),
    _type: "auditLog",
    actor: "taxonomy-v2-migration",
    actorType: "system",
    action: plan.target === "production" ? "production-taxonomy:v2-health-critical" : "uat-taxonomy:v2-health-critical",
    objectType: "article-batch",
    objectId: `taxonomy-v2:${plan.changes.length}`,
    before: JSON.stringify(before),
    after: JSON.stringify(after),
    environment: plan.target,
    requestId: options.backupId ?? `taxonomy-v2-${plan.target}`,
    timestamp,
  });

  await transaction.commit({ tag: `ccpun.${plan.target}.taxonomy-v2` });
  return { changed: plan.changes.length, categoriesCreated: plan.categoriesCreated.length, auditLogCreated: true };
}

function parseArgs(args: readonly string[]): ParsedArgs {
  if (args.includes("--self-test")) return { selfTest: true };

  const targetArg = args.find((arg) => arg.startsWith("--target="));
  const targetValue = targetArg?.slice("--target=".length);
  if (targetValue !== "uat" && targetValue !== "production") throw new Error("Use --target=uat or --target=production");
  const target: MigrationTarget = targetValue;

  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");
  if (apply && dryRun) throw new Error("Choose --apply or --dry-run, not both");
  const known = new Set([targetArg!, "--apply", "--dry-run"]);
  const unknown = args.filter((arg) => !known.has(arg));
  if (unknown.length) throw new Error(`Unknown argument: ${unknown.join(", ")}`);

  return { selfTest: false, target, mode: apply ? "apply" : "dry-run" };
}

function selfTest() {
  const categories: RawCategory[] = [
    { _id: "life-category", _type: "category", title: "ประกันชีวิต", slug: "life-insurance" },
    { _id: "drafts.health-category", _type: "category", title: "ประกันสุขภาพ", slug: "health-insurance" },
  ];
  const articles: RawArticle[] = [
    { _id: "health-happy", _rev: "r1", _type: "article", slug: "aia-health-happy-describe", categoryRef: "life-category" },
    { _id: "drafts.health-happy", _rev: "r2", _type: "article", slug: "aia-health-happy-describe", categoryRef: "life-category" },
    { _id: "health-ci", _rev: "r3", _type: "article", slug: "aia-health-ci-hero-guide", categoryRef: "life-category" },
    { _id: "critical", _rev: "r4", _type: "article", slug: "critical-illness-insurance", categoryRef: "life-category" },
  ];
  const plan = buildInsuranceTaxonomyV2Plan("uat", articles, categories);
  if (plan.changes.length !== 4) throw new Error("taxonomy V2 self-test expected four guarded article changes");
  if (plan.categoryIds["health-insurance"] !== "health-category") throw new Error("taxonomy V2 self-test failed to reuse health category identity");
  if (plan.categoryIds["critical-illness"] !== "ccpun-category-critical-illness") throw new Error("taxonomy V2 self-test failed critical category fallback");
  if (plan.categoriesCreated.length !== 2) throw new Error("taxonomy V2 self-test expected published health + critical category creates");
  console.log("PASS: insurance taxonomy V2 self-test");
}

export async function main(args = process.argv.slice(2), environment: Environment = process.env) {
  const parsed = parseArgs(args);
  if (parsed.selfTest) {
    selfTest();
    return { selfTest: true };
  }

  const config = validateMigrationEnvironment(parsed.target, parsed.mode, environment);
  const token = parsed.mode === "apply" ? config.writeToken! : (config.readToken ?? config.writeToken)!;
  const client = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    token,
    apiVersion: "2026-08-24",
    useCdn: false,
    perspective: "raw",
  });

  const slugs = INSURANCE_TAXONOMY_V2_TARGETS.map((target) => target.slug);
  const [articles, categories] = await Promise.all([
    client.fetch<RawArticle[]>(`*[_type == "article" && slug.current in $slugs]{
      _id,
      _rev,
      _type,
      "slug": slug.current,
      "categoryRef": category._ref
    }`, { slugs }),
    client.fetch<RawCategory[]>(`*[_type == "category"]{
      _id,
      _type,
      title,
      "slug": slug.current
    }`),
  ]);

  const plan = buildInsuranceTaxonomyV2Plan(parsed.target, articles, categories);
  const report = {
    mode: parsed.mode,
    target: parsed.target,
    projectId: config.projectId,
    dataset: config.dataset,
    backupId: config.backupId ?? null,
    categoriesCreated: plan.categoriesCreated,
    changedDocuments: plan.changes.length,
    changes: plan.changes,
  };

  if (parsed.mode === "dry-run") {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  const result = await applyInsuranceTaxonomyV2Plan(client as unknown as TransactionClient, plan, { backupId: config.backupId });
  console.log(JSON.stringify({ ...report, result }, null, 2));
  return { ...report, result };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
