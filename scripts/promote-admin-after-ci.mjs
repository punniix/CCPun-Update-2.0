const API_BASE = "https://api.vercel.com";
const DEFAULT_PROJECT_ID = "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN";
const DEFAULT_TEAM_ID = "team_GbcO71LS2dLHwiBV6Cs39Kax";
const DEFAULT_PROJECT_NAME = "ccpun-admin-prod";
const POLL_ATTEMPTS = 36;
const POLL_INTERVAL_MS = 10_000;

function required(name, value) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name}_MISSING`);
  return normalized;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function vercelFetch(path, token, init = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    redirect: "error",
  });
  return response;
}

async function listDeployments({ projectId, teamId, token }) {
  const params = new URLSearchParams({ projectId, teamId, limit: "100" });
  const response = await vercelFetch(`/v6/deployments?${params.toString()}`, token);
  if (!response.ok) throw new Error(`VERCEL_LIST_FAILED_${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload?.deployments) ? payload.deployments : [];
}

function matchingDeployments(deployments, sha, projectName) {
  return deployments.filter((deployment) =>
    deployment?.name === projectName
    && deployment?.meta?.githubCommitSha === sha,
  );
}

async function waitForReadyPreview(config) {
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const deployments = matchingDeployments(
      await listDeployments(config),
      config.sha,
      config.projectName,
    );

    const production = deployments.find((deployment) => deployment?.target === "production" && deployment?.state === "READY");
    if (production) return { state: "already-production", deployment: production };

    const readyPreview = deployments.find((deployment) => deployment?.target == null && deployment?.state === "READY");
    if (readyPreview) return { state: "ready-preview", deployment: readyPreview };

    const terminalFailure = deployments.find((deployment) => ["ERROR", "CANCELED", "BLOCKED"].includes(deployment?.state));
    if (terminalFailure) throw new Error(`ADMIN_DEPLOYMENT_${terminalFailure.state}`);

    if (attempt < POLL_ATTEMPTS) await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("ADMIN_READY_DEPLOYMENT_NOT_FOUND");
}

async function promote({ projectId, teamId, deploymentId, token }) {
  const params = new URLSearchParams({ teamId });
  const response = await vercelFetch(
    `/v10/projects/${encodeURIComponent(projectId)}/promote/${encodeURIComponent(deploymentId)}?${params.toString()}`,
    token,
    { method: "POST" },
  );
  if (![200, 201, 202, 204].includes(response.status)) {
    throw new Error(`VERCEL_PROMOTE_FAILED_${response.status}`);
  }
}

async function waitForProduction(config) {
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const deployments = matchingDeployments(
      await listDeployments(config),
      config.sha,
      config.projectName,
    );
    const production = deployments.find((deployment) => deployment?.target === "production" && deployment?.state === "READY");
    if (production) return production;
    if (attempt < POLL_ATTEMPTS) await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("ADMIN_PRODUCTION_PROMOTION_NOT_CONFIRMED");
}

export async function run(env = process.env) {
  const token = required("VERCEL_TOKEN", env.VERCEL_TOKEN);
  const sha = required("GITHUB_SHA", env.GITHUB_SHA);
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error("GITHUB_SHA_INVALID");

  const projectId = env.CCPUN_ADMIN_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID;
  const teamId = env.VERCEL_TEAM_ID?.trim() || DEFAULT_TEAM_ID;
  const projectName = env.CCPUN_ADMIN_PROJECT_NAME?.trim() || DEFAULT_PROJECT_NAME;
  const config = { projectId, teamId, projectName, token, sha };

  const candidate = await waitForReadyPreview(config);
  if (candidate.state === "already-production") {
    console.log(`Admin commit ${sha} is already Production (${candidate.deployment.id}).`);
    return candidate.deployment.id;
  }

  console.log(`Promoting Admin deployment ${candidate.deployment.id} for commit ${sha}.`);
  await promote({ projectId, teamId, deploymentId: candidate.deployment.id, token });
  const production = await waitForProduction(config);
  console.log(`Admin commit ${sha} is Production (${production.id}).`);
  return production.id;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : "ADMIN_PROMOTION_FAILED");
    process.exitCode = 1;
  });
}
