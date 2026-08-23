import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ALLOWED_PROJECTS = new Set(["ccpun-web-lab", "ccpun-web-v4-1-uat"]);
const BLOCKED_PROJECT = "ccpun-web-v4-prod";
const projectFile = resolve(process.cwd(), ".vercel/project.json");

let project;
try {
  project = JSON.parse(await readFile(projectFile, "utf8"));
} catch {
  console.error("Admin Lab guard: missing or unreadable .vercel/project.json");
  process.exit(1);
}

if (project.projectName === BLOCKED_PROJECT) {
  console.error("Admin Lab guard: blocked because this checkout is linked to Production.");
  process.exit(1);
}

if (!ALLOWED_PROJECTS.has(project.projectName)) {
  console.error(`Admin Preview guard: expected Lab or UAT, got ${project.projectName ?? "unknown"}.`);
  process.exit(1);
}

console.log(`Admin Preview guard: PASS (${project.projectName})`);
