import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test, { afterEach } from "node:test";
import {
  filterStudioAuthProviders,
  filterStudioDocumentActions,
  filterStudioNewDocumentOptions,
  filterStudioStructureItems,
  protectProductionContentLifecycleActions,
} from "../../cms/sanity/policy/studio-policy";
import { getStudioPublishingOptions } from "../../cms/sanity/config/publishing";
import { CCPUN_LEGACY_VERCEL_PROJECT_IDS, CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";

const PRODUCTION_ADMIN_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.adminProduction;
const ADMIN_LAB_PROJECT_ID = CCPUN_LEGACY_VERCEL_PROJECT_IDS.adminLab;
const WEB_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.web;
const UAT_SANITY_PROJECT_ID = "ccb9lnw5";
const PRODUCTION_SANITY_PROJECT_ID = "kyfxgjnq";
const originalProjectId = process.env.VERCEL_PROJECT_ID;
const originalProductionAdminProjectId = process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID;
const originalLocalProductionDraftWrites = process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES;
const studioPage = readFileSync(new URL("../../app/studio/[[...tool]]/page.tsx", import.meta.url), "utf8");
const studioClient = readFileSync(new URL("../../app/studio/[[...tool]]/studio-client.tsx", import.meta.url), "utf8");
const studioConfig = readFileSync(new URL("../../sanity.config.ts", import.meta.url), "utf8");
const studioStructure = readFileSync(new URL("../../cms/sanity/config/structure.ts", import.meta.url), "utf8");
const adminDataRefresh = readFileSync(new URL("../../features/admin/components/AdminDataRefresh.tsx", import.meta.url), "utf8");
const adminContentPage = readFileSync(new URL("../../app/snt-admin/(protected)/content/page.tsx", import.meta.url), "utf8");

afterEach(() => {
  if (originalProjectId === undefined) delete process.env.VERCEL_PROJECT_ID;
  else process.env.VERCEL_PROJECT_ID = originalProjectId;
  if (originalProductionAdminProjectId === undefined) {
    delete process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID;
  } else {
    process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID = originalProductionAdminProjectId;
  }
  if (originalLocalProductionDraftWrites === undefined) delete process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES;
  else process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES = originalLocalProductionDraftWrites;
});

function useProductionAdminProject() {
  process.env.VERCEL_PROJECT_ID = PRODUCTION_ADMIN_PROJECT_ID;
  process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID = PRODUCTION_ADMIN_PROJECT_ID;
}

function useLabProject() {
  process.env.VERCEL_PROJECT_ID = ADMIN_LAB_PROJECT_ID;
  delete process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID;
}

function useLocalProject() {
  delete process.env.VERCEL_PROJECT_ID;
  delete process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID;
}

test("Studio actions follow the application lane and dataset together", () => {
  const actions = [
    { action: "publish" },
    { action: "unpublish" },
    { action: "unpublishVersion" },
    { action: "delete" },
    { action: "duplicate" },
    { action: undefined },
  ];

  useLabProject();
  assert.deepEqual(filterStudioDocumentActions(actions, "uat", "lab", undefined, UAT_SANITY_PROJECT_ID), []);

  useLocalProject();
  assert.deepEqual(filterStudioDocumentActions(actions, "uat", "local-uat", undefined, UAT_SANITY_PROJECT_ID), [actions[4], actions[5]]);

  useProductionAdminProject();
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "production-admin", undefined, PRODUCTION_SANITY_PROJECT_ID), [
    actions[0],
    actions[4],
    actions[5],
  ]);
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "production-admin", "article", PRODUCTION_SANITY_PROJECT_ID), [
    actions[0],
    actions[1],
    actions[3],
    actions[4],
    actions[5],
  ]);

  useLabProject();
  assert.deepEqual(filterStudioDocumentActions(actions, "uat", "lab", "seoSuggestion", UAT_SANITY_PROJECT_ID), []);
  assert.deepEqual(filterStudioDocumentActions(actions, "uat", "lab", "researchSnapshot", UAT_SANITY_PROJECT_ID), []);

  useProductionAdminProject();
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "production-admin", "auditLog", PRODUCTION_SANITY_PROJECT_ID), []);

  useLabProject();
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "lab", undefined, UAT_SANITY_PROJECT_ID), []);

  process.env.VERCEL_PROJECT_ID = WEB_PROJECT_ID;
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "production", undefined, PRODUCTION_SANITY_PROJECT_ID), []);
  assert.deepEqual(filterStudioDocumentActions(actions, "uat", "unknown"), []);
});

test("UAT Studio uses Google auth and cannot schedule publishing", () => {
  const providers = [{ name: "vercel" }, { name: "google" }, { name: "github" }];

  useLabProject();
  assert.deepEqual(filterStudioAuthProviders(providers, "uat", "lab", UAT_SANITY_PROJECT_ID), []);

  useLocalProject();
  assert.deepEqual(filterStudioAuthProviders(providers, "uat", "local-uat", UAT_SANITY_PROJECT_ID), [{ name: "google" }]);

  useProductionAdminProject();
  assert.deepEqual(filterStudioAuthProviders(providers, "production", "production-admin", PRODUCTION_SANITY_PROJECT_ID), providers);

  useLabProject();
  assert.deepEqual(filterStudioAuthProviders(providers, "production", "lab", UAT_SANITY_PROJECT_ID), []);

  useLocalProject();
  assert.deepEqual(getStudioPublishingOptions("uat", "local-uat", UAT_SANITY_PROJECT_ID), {
    releases: { enabled: false },
    scheduledDrafts: { enabled: false },
    scheduledPublishing: { enabled: false },
  });
});

test("Local Production Studio is off in read mode and enables the owner article workflow in Draft mode", () => {
  useLocalProject();
  const providers = [{ name: "vercel" }, { name: "google" }];
  const actions = [
    { action: "publish" },
    { action: "unpublish" },
    { action: "delete" },
    { action: "schedule" },
    { action: "duplicate" },
    { action: undefined },
  ];
  const newDocumentOptions = [{ templateId: "article" }, { templateId: "category" }];
  delete process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES;
  assert.deepEqual(filterStudioAuthProviders(providers, "production", "local-production", PRODUCTION_SANITY_PROJECT_ID), []);
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "local-production", "article", PRODUCTION_SANITY_PROJECT_ID), []);
  assert.deepEqual(getStudioPublishingOptions("production", "local-production", PRODUCTION_SANITY_PROJECT_ID), {
    releases: { enabled: false },
    scheduledDrafts: { enabled: false },
    scheduledPublishing: { enabled: false },
  });

  process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES = "1";
  assert.deepEqual(filterStudioAuthProviders(providers, "production", "local-production", PRODUCTION_SANITY_PROJECT_ID), [{ name: "google" }]);
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "local-production", "article", PRODUCTION_SANITY_PROJECT_ID), actions.slice(0, 4));
  assert.deepEqual(filterStudioDocumentActions(actions, "production", "local-production", "author", PRODUCTION_SANITY_PROJECT_ID), []);
  assert.deepEqual(filterStudioNewDocumentOptions(newDocumentOptions, "production", "local-production", PRODUCTION_SANITY_PROJECT_ID), [newDocumentOptions[0]]);
  assert.deepEqual(filterStudioNewDocumentOptions(newDocumentOptions, "uat", "local-uat", UAT_SANITY_PROJECT_ID), [newDocumentOptions[0]]);
  assert.deepEqual(getStudioPublishingOptions("production", "local-production", PRODUCTION_SANITY_PROJECT_ID), {
    releases: { enabled: true },
    scheduledDrafts: { enabled: true },
    scheduledPublishing: { enabled: false },
  });
});

test("Production article lifecycle allows new Draft deletion but protects previously published URLs", () => {
  const deleteAction = Object.assign(
    () => ({ label: "Delete", onHandle() {} }),
    { action: "delete" as const },
  );
  const unpublishAction = Object.assign(
    () => ({ label: "Unpublish", onHandle() {} }),
    { action: "unpublish" as const },
  );
  const [guardedDelete, guardedUnpublish] = protectProductionContentLifecycleActions(
    [deleteAction, unpublishAction],
    "production-admin",
    "article",
  );

  assert.equal(guardedDelete({ published: { _id: "article-1" } } as never), null);
  assert.equal(guardedDelete({ published: null, draft: { _id: "drafts.article-1", publishedAt: "2026-08-24T00:00:00Z" } } as never), null);
  assert.equal(guardedDelete({ published: null, draft: { _id: "drafts.article-new" } } as never)?.label, "ลบฉบับร่าง");
  assert.equal(guardedUnpublish({ published: { _id: "article-1" } } as never)?.label, "นำออกจากเว็บไซต์");
  assert.equal(guardedUnpublish({ published: null, draft: { _id: "drafts.article-new" } } as never), null);
  assert.equal(protectProductionContentLifecycleActions([deleteAction], "local-uat", "article")[0], deleteAction);
  assert.equal(protectProductionContentLifecycleActions([deleteAction], "production-admin", "author")[0], deleteAction);
});

test("Studio keeps identified owner content and hides system/category management", () => {
  useLocalProject();
  const structureItems = [
    { getId: () => "article" },
    { getId: () => "category" },
    { getId: () => "auditLog" },
    { getId: () => "author" },
    { getId: () => undefined },
  ];
  const newDocumentOptions = [
    { templateId: "article" },
    { templateId: "category" },
    { templateId: "seoSuggestion" },
    { templateId: "author" },
  ];

  assert.deepEqual(filterStudioStructureItems(structureItems), [structureItems[0], structureItems[3]]);
  assert.deepEqual(filterStudioNewDocumentOptions(newDocumentOptions, "uat", "local-uat", UAT_SANITY_PROJECT_ID), [
    newDocumentOptions[0],
    newDocumentOptions[3],
  ]);

  const schemaSource = readFileSync(new URL("../../cms/sanity/schema/documents/article.ts", import.meta.url), "utf8");
  assert.match(schemaSource, /to: \[\{ type: "category" \}\]/);
  assert.match(schemaSource, /disableNew: true/);
  assert.match(schemaSource, /filter: "slug\.current in \$activeSlugs"/);
  assert.match(studioConfig, /createStudioStructurePlugin/);
  assert.match(studioStructure, /S\.list\(\)\.id\("content"\)\.title\("เนื้อหา"\)/);
});

test("Safari-safe admin routes avoid the stuck streaming boundary", () => {
  assert.equal(existsSync(new URL("../../app/snt-admin/(protected)/loading.tsx", import.meta.url)), false);
  assert.doesNotMatch(studioPage, /<NextStudio/);
  assert.match(studioClient, /import \{ Studio \} from "sanity"/);
  assert.match(studioClient, /<Studio config=\{sanityStudioConfig\}/);
});

test("Admin returns to the same Sanity data after owner editing", () => {
  assert.match(adminDataRefresh, /window\.addEventListener\("focus", refresh\)/);
  assert.match(adminDataRefresh, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/);
  assert.match(adminDataRefresh, /router\.refresh\(\)/);
  assert.match(adminContentPage, /\/studio\/intent\/create\/type=article/);
});
