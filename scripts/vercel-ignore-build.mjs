import { pathToFileURL } from "node:url";

const WEB_PROJECT_ID = "prj_dxwjITkd0av5QiJQv2snUlIASUWu";
const ADMIN_PROJECT_ID = "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN";

function isWebOnlyBranch(branch) {
  return branch.startsWith("ux/") || branch.startsWith("web/") || branch.includes("website-42");
}

function isAdminOnlyBranch(branch) {
  return branch.startsWith("admin/") || branch.startsWith("codex/admin-");
}

export function shouldBuild({ projectId, environment, branch }) {
  if (![WEB_PROJECT_ID, ADMIN_PROJECT_ID].includes(projectId)) return false;
  if (environment === "production") return true;
  if (!branch) return false;
  if (projectId === WEB_PROJECT_ID && isAdminOnlyBranch(branch)) return false;
  if (projectId === ADMIN_PROJECT_ID && isWebOnlyBranch(branch)) return false;
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const build = shouldBuild({
    projectId: process.env.VERCEL_PROJECT_ID?.trim() ?? "",
    environment: process.env.VERCEL_ENV?.trim() ?? "",
    branch: process.env.VERCEL_GIT_COMMIT_REF?.trim() ?? "",
  });

  console.log(build ? "Vercel build routing: BUILD" : "Vercel build routing: SKIP");
  process.exitCode = build ? 1 : 0;
}
