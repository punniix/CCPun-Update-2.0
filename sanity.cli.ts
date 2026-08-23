import { defineCliConfig } from "sanity/cli";
import { getAdminEnvironment, isStudioDataPlaneAllowed } from "./lib/admin/environment";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset || !isStudioDataPlaneAllowed(dataset, getAdminEnvironment(), undefined, undefined, projectId)) {
  throw new Error("Sanity CLI is disabled because its application lane is not configured safely.");
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
});
