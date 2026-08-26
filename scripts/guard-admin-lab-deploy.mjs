import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ADMIN_NONPROD_PROJECT_ID = "prj_F6yodVaz1U57FcUlEXsKBazI7KF7";
const projectFile = resolve(process.cwd(), ".vercel/project.json");

let project;
try {
  project = JSON.parse(await readFile(projectFile, "utf8"));
} catch {
  console.error("Admin Non-Production guard: missing or unreadable .vercel/project.json");
  process.exit(1);
}

const projectId = typeof project.projectId === "string" ? project.projectId.trim() : "";

if (!projectId) {
  console.error("Admin Non-Production guard: missing Vercel project ID.");
  process.exit(1);
}

if (projectId !== ADMIN_NONPROD_PROJECT_ID) {
  console.error(`Admin Non-Production guard: unapproved Vercel project ID ${projectId}.`);
  process.exit(1);
}

console.log(`Admin Non-Production guard: PASS (${projectId})`);
