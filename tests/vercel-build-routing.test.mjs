import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { shouldBuild } from "../scripts/vercel-ignore-build.mjs";

const web = "prj_dxwjITkd0av5QiJQv2snUlIASUWu";
const admin = "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN";

test("Website 4.2 builds only in the Web survivor", () => {
  const input = { environment: "preview", branch: "ux/final-4.2" };
  assert.equal(shouldBuild({ ...input, projectId: web }), true);
  assert.equal(shouldBuild({ ...input, projectId: admin }), false);
});

test("Admin-only branches build only in the Admin survivor", () => {
  const input = { environment: "preview", branch: "admin/review-queue" };
  assert.equal(shouldBuild({ ...input, projectId: web }), false);
  assert.equal(shouldBuild({ ...input, projectId: admin }), true);
});

test("shared 4.1 and Production releases build in both survivors", () => {
  for (const projectId of [web, admin]) {
    assert.equal(shouldBuild({ projectId, environment: "preview", branch: "codex/website-41-p0-security-20260827" }), true);
    assert.equal(shouldBuild({ projectId, environment: "production", branch: "v4-production" }), true);
  }
});

test("unknown Projects or missing branch identity fail closed", () => {
  assert.equal(shouldBuild({ projectId: "prj_legacy", environment: "preview", branch: "ux/final-4.2" }), false);
  assert.equal(shouldBuild({ projectId: web, environment: "preview", branch: "" }), false);
});

test("Ignored Build Step uses Vercel exit semantics", () => {
  const run = (projectId) => spawnSync(process.execPath, ["scripts/vercel-ignore-build.mjs"], {
    env: { ...process.env, VERCEL_PROJECT_ID: projectId, VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "ux/final-4.2" },
  });

  assert.equal(run(web).status, 1, "exit 1 continues the Web build");
  assert.equal(run(admin).status, 0, "exit 0 skips the Admin build");
});
