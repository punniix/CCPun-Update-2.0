import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isAdminDataPlaneAllowed,
  isAdminReadDataPlaneAllowed,
  isAdminMutationEnvironment,
  isDeploymentProjectAllowed,
  isSanityProjectAllowed,
  isSanityLaneAllowed,
  isStudioDataPlaneAllowed,
  isLocalProductionDraftWriteEnabled,
  parseAdminEnvironment,
  resolveSanityConfigEnvironment,
} from "../../lib/admin/environment";
import { shouldEnforceHttps } from "../../lib/security-policy";

const PRODUCTION_ADMIN_PROJECT_ID = "prj_ccpun_admin_prod";
const UAT_SANITY_PROJECT_ID = "ccb9lnw5";
const PRODUCTION_SANITY_PROJECT_ID = "kyfxgjnq";

const retiredPublisher = readFileSync(new URL("../../scripts/publish-wordpress-migration-to-sanity.mjs", import.meta.url), "utf8");
const publishedDraftImporter = readFileSync(new URL("../../scripts/import-wordpress-published-to-sanity.mjs", import.meta.url), "utf8");
const draftImporter = readFileSync(new URL("../../scripts/import-wordpress-drafts-to-sanity.mjs", import.meta.url), "utf8");
const draftSeeder = readFileSync(new URL("../../scripts/create-sanity-uat-draft.mjs", import.meta.url), "utf8");
const studioConfig = readFileSync(new URL("../../sanity.config.ts", import.meta.url), "utf8");
const studioCli = readFileSync(new URL("../../sanity.cli.ts", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

test("lab and UAT admin clients accept only the uat dataset", () => {
  assert.equal(isAdminDataPlaneAllowed("uat", "development", undefined, undefined, UAT_SANITY_PROJECT_ID), true);
  assert.equal(isAdminDataPlaneAllowed("uat", "lab", undefined, undefined, UAT_SANITY_PROJECT_ID), true);
  assert.equal(isAdminDataPlaneAllowed("uat", "uat", undefined, undefined, UAT_SANITY_PROJECT_ID), true);
  assert.equal(isAdminDataPlaneAllowed("production", "lab", undefined, undefined, UAT_SANITY_PROJECT_ID), false);
  assert.equal(isAdminDataPlaneAllowed("production", "uat", undefined, undefined, UAT_SANITY_PROJECT_ID), false);
  assert.equal(isAdminDataPlaneAllowed(undefined, "lab", undefined, undefined, UAT_SANITY_PROJECT_ID), false);
  assert.equal(isAdminDataPlaneAllowed("UAT", "lab", undefined, undefined, UAT_SANITY_PROJECT_ID), false);
});

test("each application lane accepts only its exact dataset", () => {
  assert.equal(isSanityLaneAllowed("uat", "development", undefined, undefined, UAT_SANITY_PROJECT_ID), true);
  assert.equal(isSanityLaneAllowed("uat", "lab", undefined, undefined, UAT_SANITY_PROJECT_ID), true);
  assert.equal(isSanityLaneAllowed("uat", "uat", undefined, undefined, UAT_SANITY_PROJECT_ID), true);
  assert.equal(
    isSanityLaneAllowed(
      "production",
      "production-admin",
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_SANITY_PROJECT_ID,
    ),
    true,
  );
  assert.equal(isSanityLaneAllowed("production", "production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), true);
  assert.equal(isSanityLaneAllowed("production", "lab", undefined, undefined, UAT_SANITY_PROJECT_ID), false);
  assert.equal(
    isSanityLaneAllowed("uat", "production-admin", PRODUCTION_ADMIN_PROJECT_ID, PRODUCTION_ADMIN_PROJECT_ID, PRODUCTION_SANITY_PROJECT_ID),
    false,
  );
  assert.equal(isSanityLaneAllowed("uat", "production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), false);
  assert.equal(isSanityLaneAllowed(undefined, "unknown"), false);
});

test("public production cannot mount admin clients or Studio", () => {
  assert.equal(isAdminDataPlaneAllowed("uat", "production"), false);
  assert.equal(isAdminDataPlaneAllowed("production", "production"), false);
  assert.equal(isStudioDataPlaneAllowed("production", "production"), false);
  assert.equal(
    isAdminDataPlaneAllowed(
      "production",
      "production-admin",
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_SANITY_PROJECT_ID,
    ),
    true,
  );
  assert.equal(
    isStudioDataPlaneAllowed(
      "production",
      "production-admin",
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_SANITY_PROJECT_ID,
    ),
    true,
  );
  assert.equal(isAdminDataPlaneAllowed("uat", "unknown"), false);
  assert.equal(isAdminMutationEnvironment("production"), false);
  assert.equal(isAdminMutationEnvironment("unknown"), false);
});

test("Local Production reads only the exact Production lane and writes fail closed by default", () => {
  delete process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES;
  assert.equal(isAdminReadDataPlaneAllowed("production", "local-production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), true);
  assert.equal(isAdminReadDataPlaneAllowed("uat", "local-production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), false);
  assert.equal(isAdminReadDataPlaneAllowed("production", "local-production", undefined, undefined, UAT_SANITY_PROJECT_ID), false);
  assert.equal(isAdminMutationEnvironment("local-production"), false);
  assert.equal(isAdminDataPlaneAllowed("production", "local-production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), false);
  assert.equal(isStudioDataPlaneAllowed("production", "local-production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), false);
});

test("Local Production Draft mode requires one explicit exact flag", () => {
  assert.equal(isLocalProductionDraftWriteEnabled("local-production", "0"), false);
  assert.equal(isLocalProductionDraftWriteEnabled("local-production", "true"), false);
  assert.equal(isLocalProductionDraftWriteEnabled("local-production", "1"), true);
  process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES = "1";
  assert.equal(isAdminMutationEnvironment("local-production"), true);
  assert.equal(isAdminDataPlaneAllowed("production", "local-production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), true);
  assert.equal(isStudioDataPlaneAllowed("production", "local-production", undefined, undefined, PRODUCTION_SANITY_PROJECT_ID), true);
  delete process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES;
});

test("production-admin fails closed outside its dedicated Vercel project", () => {
  assert.equal(isDeploymentProjectAllowed("production-admin", undefined, undefined), false);
  assert.equal(
    isDeploymentProjectAllowed("production-admin", "prj_public_production", PRODUCTION_ADMIN_PROJECT_ID),
    false,
  );
  assert.equal(
    isAdminDataPlaneAllowed(
      "production",
      "production-admin",
      "prj_public_production",
      PRODUCTION_ADMIN_PROJECT_ID,
      PRODUCTION_SANITY_PROJECT_ID,
    ),
    false,
  );
  assert.equal(
    isStudioDataPlaneAllowed("production", "production-admin", undefined, PRODUCTION_ADMIN_PROJECT_ID, PRODUCTION_SANITY_PROJECT_ID),
    false,
  );
  assert.equal(
    isAdminMutationEnvironment("production-admin", PRODUCTION_ADMIN_PROJECT_ID, PRODUCTION_ADMIN_PROJECT_ID),
    true,
  );
  assert.equal(
    isAdminMutationEnvironment("production-admin", "prj_public_production", PRODUCTION_ADMIN_PROJECT_ID),
    false,
  );
});

test("missing and unrecognized application lanes fail closed", () => {
  assert.equal(parseAdminEnvironment(undefined), "unknown");
  assert.equal(parseAdminEnvironment(""), "unknown");
  assert.equal(parseAdminEnvironment("staging"), "unknown");
  assert.equal(parseAdminEnvironment("LAB"), "lab");
  assert.equal(parseAdminEnvironment("LOCAL-UAT"), "local-uat");
  assert.equal(parseAdminEnvironment("LOCAL-PRODUCTION"), "local-production");
});

test("Sanity projects are pinned to their environment lane", () => {
  assert.equal(isSanityProjectAllowed(UAT_SANITY_PROJECT_ID, "development"), true);
  assert.equal(isSanityProjectAllowed(UAT_SANITY_PROJECT_ID, "lab"), true);
  assert.equal(isSanityProjectAllowed(UAT_SANITY_PROJECT_ID, "uat"), true);
  assert.equal(isSanityProjectAllowed(UAT_SANITY_PROJECT_ID, "local-uat"), true);
  assert.equal(isSanityProjectAllowed(PRODUCTION_SANITY_PROJECT_ID, "production-admin"), true);
  assert.equal(isSanityProjectAllowed(PRODUCTION_SANITY_PROJECT_ID, "local-production"), true);
  assert.equal(isSanityProjectAllowed(PRODUCTION_SANITY_PROJECT_ID, "production"), true);
  assert.equal(isSanityProjectAllowed(PRODUCTION_SANITY_PROJECT_ID, "local-uat"), false);
  assert.equal(isSanityProjectAllowed(UAT_SANITY_PROJECT_ID, "production-admin"), false);
  assert.equal(isSanityProjectAllowed(undefined, "local-uat"), false);
});

test("Local UAT keeps HTTP on loopback while deployed lanes enforce HTTPS", () => {
  assert.equal(shouldEnforceHttps("local-uat"), false);
  assert.equal(shouldEnforceHttps("local-production"), false);
  assert.equal(shouldEnforceHttps("lab"), true);
  assert.equal(shouldEnforceHttps("uat"), true);
  assert.equal(shouldEnforceHttps("production-admin"), true);
  assert.equal(shouldEnforceHttps(undefined), true);
});

test("Local Production launch scripts pin the exact project, dataset, host, and Draft switch", () => {
  const readScript = packageJson.scripts["local:production:read"];
  const draftScript = packageJson.scripts["local:production:draft"];
  for (const script of [readScript, draftScript]) {
    assert.match(script, /CCPUN_APP_ENV=local-production/);
    assert.match(script, /NEXT_PUBLIC_SANITY_PROJECT_ID=kyfxgjnq/);
    assert.match(script, /NEXT_PUBLIC_SANITY_DATASET=production/);
    assert.match(script, /AUTH_URL=http:\/\/localhost:3000/);
    assert.match(script, /next dev --webpack/);
    assert.match(script, /--hostname 127\.0\.0\.1 --port 3000/);
    assert.doesNotMatch(script, /SANITY_(?:PRODUCTION_)?API_(?:READ|WRITE)_TOKEN=/);
  }
  assert.match(readScript, /CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES=0/);
  assert.match(readScript, /NEXT_PUBLIC_CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES=0/);
  assert.match(draftScript, /CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES=1/);
  assert.match(draftScript, /NEXT_PUBLIC_CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES=1/);
});

test("Local UAT uses a dedicated port separate from Local Production", () => {
  const uatScript = packageJson.scripts["local:uat"];
  assert.match(uatScript, /AUTH_URL=http:\/\/localhost:3100/);
  assert.match(uatScript, /--hostname 127\.0\.0\.1 --port 3100/);
  assert.doesNotMatch(uatScript, /localhost:3000|--port 3000/);
});

test("server-side Studio config rejects missing or conflicting public lanes", () => {
  assert.equal(resolveSanityConfigEnvironment("lab", "lab", true), "lab");
  assert.equal(resolveSanityConfigEnvironment(undefined, "lab", true), "lab");
  assert.equal(resolveSanityConfigEnvironment("production-admin", "lab", true), "unknown");
  assert.equal(resolveSanityConfigEnvironment("production-admin", undefined, true), "unknown");
  assert.equal(resolveSanityConfigEnvironment("lab", undefined, false), "lab");
  assert.equal(resolveSanityConfigEnvironment(undefined, "lab", false), "unknown");
  assert.match(studioConfig, /isStudioDataPlaneAllowed\(dataset, environment, undefined, undefined, projectId\)/);
  assert.match(studioCli, /isStudioDataPlaneAllowed\(dataset, getAdminEnvironment\(\), undefined, undefined, projectId\)/);
});

test("legacy migration scripts cannot publish or write outside UAT", () => {
  assert.match(retiredPublisher, /PRODUCTION_PUBLISH_SCRIPT_DISABLED/);
  assert.doesNotMatch(retiredPublisher, /createClient|transaction|SANITY_API_WRITE_TOKEN/);
  assert.match(publishedDraftImporter, /commit && process\.env\.CCPUN_UAT_MODE !== '1'/);
  assert.match(publishedDraftImporter, /commit && dataset\.trim\(\) !== 'uat'/);
  for (const script of [publishedDraftImporter, draftImporter, draftSeeder]) {
    assert.match(script, /projectId\.trim\(\) !== UAT_PROJECT_ID/);
  }
  assert.ok(publishedDraftImporter.indexOf("CCPUN_UAT_MODE") < publishedDraftImporter.indexOf("readFile(inputPath"));
});
