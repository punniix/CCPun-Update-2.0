import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { CCPUN_VERCEL_PROJECT_IDS } from "../../lib/admin/environment";
import { getAdminRoleForEmail, hasAdminPermission } from "../../lib/admin/rbac";
import { ADMIN_ACTIONS, evaluateAdminAction } from "../../lib/admin/policy";

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

test("email allowlist maps to the configured role", () => {
  process.env.CCPUN_ADMIN_OWNER_EMAILS = "owner@example.com";
  process.env.CCPUN_ADMIN_EDITOR_EMAILS = "editor@example.com";

  assert.equal(getAdminRoleForEmail("OWNER@example.com"), "owner");
  assert.equal(getAdminRoleForEmail("editor@example.com"), "editor");
  assert.equal(getAdminRoleForEmail("unknown@example.com"), null);
});

test("owner has apply permission but viewer does not", () => {
  assert.equal(hasAdminPermission("owner", "draft:apply"), true);
  assert.equal(hasAdminPermission("viewer", "draft:apply"), false);
});

test("AI cannot approve its own proposal", () => {
  const decision = evaluateAdminAction({
    actorType: "ai",
    role: "owner",
    action: "review:approve",
    environment: "lab",
  });

  assert.equal(decision.allowed, false);
});

test("AI cannot apply a draft mutation", () => {
  const decision = evaluateAdminAction({
    actorType: "ai",
    role: "owner",
    action: "draft:apply",
    environment: "lab",
  });

  assert.equal(decision.allowed, false);
});

test("system actors cannot approve, apply, or publish", () => {
  for (const action of ["review:approve", "draft:apply", "content:publish"] as const) {
    assert.equal(
      evaluateAdminAction({ actorType: "system", role: "owner", action, environment: "lab" }).allowed,
      false,
      action,
    );
  }
});

test("human owner may apply approved work only in a dedicated Admin lane", () => {
  process.env.VERCEL_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.adminProduction;
  process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.adminProduction;

  assert.equal(
    evaluateAdminAction({
      actorType: "human",
      role: "owner",
      action: "draft:apply",
      environment: "production-admin",
    }).allowed,
    true,
  );

  delete process.env.VERCEL_PROJECT_ID;
  assert.equal(
    evaluateAdminAction({
      actorType: "human",
      role: "owner",
      action: "draft:apply",
      environment: "local-uat",
    }).allowed,
    true,
  );

  process.env.VERCEL_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.adminNonproduction;
  assert.equal(
    evaluateAdminAction({
      actorType: "human",
      role: "owner",
      action: "draft:apply",
      environment: "lab",
    }).allowed,
    true,
  );

  process.env.VERCEL_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.web;
  assert.equal(
    evaluateAdminAction({
      actorType: "human",
      role: "owner",
      action: "draft:apply",
      environment: "production",
    }).allowed,
    false,
  );
});

test("Local Production read mode denies every mutation", () => {
  delete process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES;
  assert.equal(evaluateAdminAction({ actorType: "human", role: "owner", action: "dashboard:read", environment: "local-production" }).allowed, true);
  assert.equal(evaluateAdminAction({ actorType: "human", role: "owner", action: "content:read", environment: "local-production" }).allowed, true);
  for (const action of ADMIN_ACTIONS.filter((value) => value !== "dashboard:read" && value !== "content:read")) {
    assert.equal(evaluateAdminAction({ actorType: "human", role: "owner", action, environment: "local-production" }).allowed, false, action);
  }
});

test("Local Production Draft mode permits only the human owner Draft workflow", () => {
  process.env.CCPUN_LOCAL_PRODUCTION_DRAFT_WRITES = "1";
  for (const action of ["seo:audit", "proposal:create", "research:create", "review:approve", "draft:apply"] as const) {
    assert.equal(evaluateAdminAction({ actorType: "human", role: "owner", action, environment: "local-production" }).allowed, true, action);
    assert.equal(evaluateAdminAction({ actorType: "ai", role: "owner", action, environment: "local-production" }).allowed, false, action);
  }
  for (const action of ["content:publish", "content:delete"] as const) {
    assert.equal(evaluateAdminAction({ actorType: "human", role: "owner", action, environment: "local-production" }).allowed, false, action);
  }
});

test("high-risk actions are hard denied even for a human owner", () => {
  process.env.VERCEL_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.adminProduction;
  process.env.CCPUN_PRODUCTION_ADMIN_VERCEL_PROJECT_ID = CCPUN_VERCEL_PROJECT_IDS.adminProduction;

  const actions = [
    "content:publish",
    "content:delete",
    "seo:canonical-change",
    "seo:redirect-change",
    "seo:noindex-change",
    "production:config-change",
    "production:deploy",
    "dns:change",
  ] as const;

  for (const environment of ["local-uat", "lab", "production-admin"] as const) {
    for (const action of actions) {
      assert.equal(
        evaluateAdminAction({ actorType: "human", role: "owner", action, environment }).allowed,
        false,
        `${environment}:${action}`,
      );
    }
  }
});


test("deterministic SEO audit is allowed for human owner and AI/system analysis", () => {
  assert.equal(
    evaluateAdminAction({ actorType: "human", role: "owner", action: "seo:audit", environment: "lab" }).allowed,
    true,
  );
  assert.equal(
    evaluateAdminAction({ actorType: "ai", role: null, action: "seo:audit", environment: "lab" }).allowed,
    true,
  );
  assert.equal(
    evaluateAdminAction({ actorType: "system", role: null, action: "seo:audit", environment: "uat" }).allowed,
    true,
  );
});
