import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SURVIVOR_PROJECT_IDS = new Set([
  "prj_dxwjITkd0av5QiJQv2snUlIASUWu",
  "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN",
]);
const LEGACY_PROJECT_IDS = new Set([
  "prj_F6yodVaz1U57FcUlEXsKBazI7KF7",
  "prj_E3Z5RDozUgrbW625d6pE8aQdfQuK",
  "prj_OR7AlGsE8spGahQegDvd0JudaiEg",
  "prj_438M14AAob2nbf20q7Xa5L7A7aMo",
]);
const projectFile = resolve(process.cwd(), ".vercel/project.json");

let project;
try {
  project = JSON.parse(await readFile(projectFile, "utf8"));
} catch {
  console.error("Survivor deploy guard: missing or unreadable .vercel/project.json");
  process.exit(1);
}

const projectId = typeof project.projectId === "string" ? project.projectId.trim() : "";

if (LEGACY_PROJECT_IDS.has(projectId)) {
  console.error("Survivor deploy guard: blocked because this checkout is linked to a LEGACY-FROZEN project.");
  process.exit(1);
}

if (!SURVIVOR_PROJECT_IDS.has(projectId)) {
  console.error(`Survivor deploy guard: unapproved Vercel project ID ${projectId || "missing"}.`);
  process.exit(1);
}

console.log(`Survivor deploy guard: PASS (${projectId})`);
