import { isStudioDataPlaneAllowed, type AdminEnvironment } from "../../../lib/admin/environment";

export function getStudioPublishingOptions(
  dataset: string,
  environment: AdminEnvironment,
  projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
) {
  const scheduledDraftsEnabled =
    environment === "local-production" &&
    isStudioDataPlaneAllowed(dataset, environment, undefined, undefined, projectId);

  return {
    // ponytail: use Sanity's current single-document scheduled release instead of a second scheduler.
    releases: { enabled: scheduledDraftsEnabled },
    scheduledDrafts: { enabled: scheduledDraftsEnabled },
    scheduledPublishing: { enabled: false },
  };
}
