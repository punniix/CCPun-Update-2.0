import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/seo-topic-hubs-ci.yml", "utf8");
const promoter = readFileSync("scripts/promote-admin-after-ci.mjs", "utf8");

test("Admin promotion runs only after verified pushes to v4-production", () => {
  assert.match(workflow, /promote-admin:/);
  assert.match(workflow, /needs: verify/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/v4-production'/);
  assert.doesNotMatch(workflow, /pull_request[^\n]*promote-admin/);
});

test("Admin promotion is pinned to the immutable Admin project and exact commit SHA", () => {
  assert.match(workflow, /CCPUN_ADMIN_PROJECT_ID: prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN/);
  assert.match(workflow, /VERCEL_TEAM_ID: team_GbcO71LS2dLHwiBV6Cs39Kax/);
  assert.match(workflow, /GITHUB_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(promoter, /deployment\?\.meta\?\.githubCommitSha === sha/);
  assert.match(promoter, /deployment\?\.name === projectName/);
  assert.match(promoter, /deployment\?\.state === "READY"/);
});

test("Admin promotion uses the official Vercel promote endpoint and fails closed", () => {
  assert.match(promoter, /\/v10\/projects\/\$\{encodeURIComponent\(projectId\)\}\/promote\/\$\{encodeURIComponent\(deploymentId\)\}/);
  assert.match(promoter, /required\("VERCEL_TOKEN", env\.VERCEL_TOKEN\)/);
  assert.match(promoter, /throw new Error\(`\$\{name\}_MISSING`\)/);
  assert.match(promoter, /ADMIN_READY_DEPLOYMENT_NOT_FOUND/);
  assert.match(promoter, /ADMIN_PRODUCTION_PROMOTION_NOT_CONFIRMED/);
  assert.match(promoter, /target === "production"/);
  assert.match(workflow, /secrets\.VERCEL_TOKEN/);
  assert.doesNotMatch(workflow, /VERCEL_TOKEN:\s*vercel_/);
  assert.doesNotMatch(promoter, /vercel_[A-Za-z0-9_-]{10,}/);
});
