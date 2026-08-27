import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SURVIVOR_PROJECT_IDS = new Set([
  "prj_dxwjITkd0av5QiJQv2snUlIASUWu",
  "prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN",
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

if (!SURVIVOR_PROJECT_IDS.has(projectId)) {
  console.error(`Survivor deploy guard: unapproved Vercel project ID ${projectId || "missing"}.`);
  process.exit(1);
}

console.log(`Survivor deploy guard: PASS (${projectId})`);
