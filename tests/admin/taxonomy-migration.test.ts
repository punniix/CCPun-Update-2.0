import assert from "node:assert/strict";
import test from "node:test";
import {
  applyInsuranceTaxonomyV2Plan,
  buildInsuranceTaxonomyV2Plan,
  validateMigrationEnvironment,
  type RawArticle,
  type RawCategory,
  type TransactionClient,
} from "../../scripts/migrate-insurance-taxonomy-v2";

const lifeCategory: RawCategory = {
  _id: "life-category",
  _type: "category",
  title: "ประกันชีวิต",
  slug: "life-insurance",
};

function requiredArticles(categoryRef = "life-category"): RawArticle[] {
  return [
    {
      _id: "health-happy",
      _rev: "r1",
      _type: "article",
      slug: "aia-health-happy-describe",
      categoryRef,
    },
    {
      _id: "drafts.health-happy",
      _rev: "r2",
      _type: "article",
      slug: "aia-health-happy-describe",
      categoryRef,
    },
    {
      _id: "health-ci",
      _rev: "r3",
      _type: "article",
      slug: "aia-health-ci-hero-guide",
      categoryRef,
    },
    {
      _id: "critical",
      _rev: "r4",
      _type: "article",
      slug: "critical-illness-insurance",
      categoryRef,
    },
  ];
}

test("UAT environment is pinned to the isolated non-production project", () => {
  const config = validateMigrationEnvironment("uat", "dry-run", {
    CCPUN_APP_ENV: "local-uat",
    SANITY_API_PROJECT_ID: "ccb9lnw5",
    SANITY_API_DATASET: "uat",
    SANITY_API_READ_TOKEN: "read",
  });
  assert.equal(config.projectId, "ccb9lnw5");
  assert.equal(config.dataset, "uat");
  assert.equal(config.backupId, undefined);

  assert.throws(() => validateMigrationEnvironment("uat", "dry-run", {
    CCPUN_APP_ENV: "local-uat",
    SANITY_API_PROJECT_ID: "kyfxgjnq",
    SANITY_API_DATASET: "uat",
    SANITY_API_READ_TOKEN: "read",
  }), /SANITY_API_PROJECT_ID/);
});

test("Production apply requires the dedicated migration lane, approval flag, backup ID and write token", () => {
  const base = {
    CCPUN_APP_ENV: "production-migration",
    SANITY_API_PROJECT_ID: "kyfxgjnq",
    SANITY_API_DATASET: "production",
    SANITY_API_WRITE_TOKEN: "write",
  };

  assert.throws(() => validateMigrationEnvironment("production", "apply", base), /approval flag/);
  assert.throws(() => validateMigrationEnvironment("production", "apply", {
    ...base,
    CCPUN_TAXONOMY_V2_APPROVED: "1",
  }), /backup ID/);

  const config = validateMigrationEnvironment("production", "apply", {
    ...base,
    CCPUN_TAXONOMY_V2_APPROVED: "1",
    CCPUN_TAXONOMY_V2_BACKUP_ID: "pre-seo-v2-20260824",
  });
  assert.equal(config.backupId, "pre-seo-v2-20260824");

  assert.throws(() => validateMigrationEnvironment("production", "apply", {
    ...base,
    CCPUN_APP_ENV: "production",
    CCPUN_TAXONOMY_V2_APPROVED: "1",
    CCPUN_TAXONOMY_V2_BACKUP_ID: "backup",
  }), /CCPUN_APP_ENV/);
});

test("plan reuses an existing health category identity and creates missing published category counterparts", () => {
  const categories: RawCategory[] = [
    lifeCategory,
    {
      _id: "drafts.existing-health",
      _type: "category",
      title: "ประกันสุขภาพ",
      slug: "health-insurance",
    },
  ];

  const plan = buildInsuranceTaxonomyV2Plan("uat", requiredArticles(), categories);
  assert.equal(plan.categoryIds["health-insurance"], "existing-health");
  assert.equal(plan.categoryIds["critical-illness"], "ccpun-category-critical-illness");
  assert.deepEqual(plan.categoriesCreated.map((item) => [item._id, item.slug.current]), [
    ["existing-health", "health-insurance"],
    ["ccpun-category-critical-illness", "critical-illness"],
  ]);
  assert.equal(plan.changes.length, 4);
  assert.equal(plan.changes.filter((change) => change.afterCategorySlug === "health-insurance").length, 3);
  assert.equal(plan.changes.filter((change) => change.afterCategorySlug === "critical-illness").length, 1);
});

test("already-final article variants are idempotent", () => {
  const categories: RawCategory[] = [
    lifeCategory,
    { _id: "health", _type: "category", title: "ประกันสุขภาพ", slug: "health-insurance" },
    { _id: "critical", _type: "category", title: "ประกันโรคร้ายแรง", slug: "critical-illness" },
  ];
  const articles = requiredArticles().map((article) => ({
    ...article,
    categoryRef: article.slug === "critical-illness-insurance" ? "critical" : "health",
  }));
  const plan = buildInsuranceTaxonomyV2Plan("production", articles, categories);
  assert.deepEqual(plan.categoriesCreated, []);
  assert.deepEqual(plan.changes, []);
});

test("unexpected category state and duplicate logical slugs fail closed", () => {
  const unknownCategory: RawCategory = {
    _id: "unknown",
    _type: "category",
    title: "Unknown",
    slug: "unknown",
  };
  assert.throws(
    () => buildInsuranceTaxonomyV2Plan("uat", requiredArticles("unknown"), [unknownCategory]),
    /expected life-insurance or/,
  );

  assert.throws(
    () => buildInsuranceTaxonomyV2Plan("uat", [
      ...requiredArticles(),
      {
        _id: "another-health-happy",
        _rev: "r5",
        _type: "article",
        slug: "aia-health-happy-describe",
        categoryRef: "life-category",
      },
    ], [lifeCategory]),
    /duplicate logical article/,
  );

  assert.throws(
    () => buildInsuranceTaxonomyV2Plan("uat", requiredArticles().filter((article) => article.slug !== "critical-illness-insurance"), [lifeCategory]),
    /required article slug critical-illness-insurance is missing/,
  );
});

test("apply changes only category references with revision guards and one atomic audit", async () => {
  const operations: Array<Record<string, unknown>> = [];
  let commitCount = 0;
  const transaction = {
    createIfNotExists(document: Record<string, unknown>) {
      operations.push({ kind: "createIfNotExists", document });
      return transaction;
    },
    patch(id: string, factory: (patch: { ifRevisionId(revision: string): unknown }) => unknown) {
      const state: Record<string, unknown> = { kind: "patch", id };
      const builder = {
        ifRevisionId(revision: string) {
          state.revision = revision;
          return {
            set(fields: Record<string, unknown>) {
              state.set = fields;
              return builder;
            },
          };
        },
      };
      factory(builder);
      operations.push(state);
      return transaction;
    },
    async commit(options: { tag: string }) {
      commitCount += 1;
      operations.push({ kind: "commit", options });
      return {};
    },
  };
  const client = { transaction: () => transaction } as unknown as TransactionClient;
  const plan = buildInsuranceTaxonomyV2Plan("uat", requiredArticles(), [lifeCategory]);

  const result = await applyInsuranceTaxonomyV2Plan(client, plan, {
    timestamp: "2026-08-24T00:00:00.000Z",
    backupId: "uat-fixture",
  });

  assert.equal(result.changed, 4);
  assert.equal(commitCount, 1);
  assert.equal(operations.filter((operation) => operation.kind === "patch").length, 4);
  for (const operation of operations.filter((item) => item.kind === "patch")) {
    assert.deepEqual(Object.keys(operation.set as Record<string, unknown>), ["category"]);
    assert.ok(operation.revision);
  }
  const serialized = JSON.stringify(operations);
  assert.doesNotMatch(serialized, /body|title|seo|tags|publishedAt|delete|createOrReplace/);
  assert.match(serialized, /uat-taxonomy:v2-health-critical/);
});
