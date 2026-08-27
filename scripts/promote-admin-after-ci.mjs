const API_BASE = "https://api.vercel.com";
const DEFAULT_PROJECT_ID = "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN";
const DEFAULT_TEAM_ID = "team_GbcO71LS2dLHwiBV6Cs39Kax";
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

function deploymentIdentifier(deployment) {
  const value = deployment?.uid ?? deployment?.id;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("ADMIN_DEPLOYMENT_ID_MISSING");
  }
  return value.trim();
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

function matchingDeployments(deployments, sha) {
  return deployments.filter((deployment) => deployment?.meta?.githubCommitSha === sha);
}

async function waitForReadyPreview(config) {
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const deployments = matchingDeployments(
      await listDeployments(config),
      config.sha,
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

async function createProductionFromPreview({ teamId, deploymentId, projectName, token }) {
  const params = new URLSearchParams({ teamId });
  const response = await vercelFetch(
    `/v13/deployments?${params.toString()}`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deploymentId,
        name: projectName,
        target: "production",
        meta: { action: "promote" },
      }),
    },
  );
  if (![200, 201, 202].includes(response.status)) {
    throw new Error(`VERCEL_PRODUCTION_CREATE_FAILED_${response.status}`);
  }
}

async function waitForProduction(config) {
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const deployments = matchingDeployments(
      await listDeployments(config),
      config.sha,
    );
    const production = deployments.find((deployment) => deployment?.target === "production" && deployment?.state === "READY");
    if (production) return production;

    const terminalFailure = deployments.find((deployment) =>
      deployment?.target === "production"
      && ["ERROR", "CANCELED", "BLOCKED"].includes(deployment?.state),
    );
    if (terminalFailure) throw new Error(`ADMIN_PRODUCTION_DEPLOYMENT_${terminalFailure.state}`);

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
  const config = { projectId, teamId, token, sha };

  const candidate = await waitForReadyPreview(config);
  const candidateId = deploymentIdentifier(candidate.deployment);
  if (candidate.state === "already-production") {
    console.log(`Admin commit ${sha} is already Production (${candidateId}).`);
    return candidateId;
  }

  console.log(`Creating Production Admin deployment from Preview ${candidateId} for commit ${sha}.`);
  const projectName = required("ADMIN_DEPLOYMENT_NAME", candidate.deployment?.name);
  await createProductionFromPreview({ teamId, deploymentId: candidateId, projectName, token });
  const production = await waitForProduction(config);
  const productionId = deploymentIdentifier(production);
  console.log(`Admin commit ${sha} is Production (${productionId}).`);
  return productionId;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : "ADMIN_PROMOTION_FAILED");
    process.exitCode = 1;
  });
}
