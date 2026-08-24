import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ALLOWED_PROJECT_IDS = new Set([
  "prj_438M14AAob2nbf20q7Xa5L7A7aMo",
  "prj_OR7AlGsE8spGahQegDvd0JudaiEg",
]);
const BLOCKED_PROJECT_IDS = new Set([
  "prj_dxwjITkd0av5QiJQv2snUlIASUWu",
  "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN",
]);
const projectFile = resolve(process.cwd(), ".vercel/project.json");

let project;
try {
  project = JSON.parse(await readFile(projectFile, "utf8"));
} catch {
  console.error("Admin Lab guard: missing or unreadable .vercel/project.json");
  process.exit(1);
}

const projectId = typeof project.projectId === "string" ? project.projectId.trim() : "";

if (!projectId) {
  console.error("Admin Preview guard: missing Vercel project ID.");
  process.exit(1);
}

if (BLOCKED_PROJECT_IDS.has(projectId)) {
  console.error("Admin Lab guard: blocked because this checkout is linked to a Production project.");
  process.exit(1);
}

if (!ALLOWED_PROJECT_IDS.has(projectId)) {
  console.error(`Admin Preview guard: unapproved Vercel project ID ${projectId}.`);
  process.exit(1);
}

console.log(`Admin Preview guard: PASS (${projectId})`);
