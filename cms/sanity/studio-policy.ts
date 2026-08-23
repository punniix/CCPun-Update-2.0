import type { DocumentActionComponent } from "sanity";
import { isStudioDataPlaneAllowed, type AdminEnvironment } from "../../lib/admin/environment";

const BLOCKED_NON_PRODUCTION_ACTIONS = new Set(["delete", "publish", "unpublish", "unpublishVersion"]);
const BLOCKED_PRODUCTION_ADMIN_ACTIONS = new Set(["delete", "unpublish", "unpublishVersion"]);
const LOCAL_PRODUCTION_ARTICLE_ACTIONS = new Set(["publish", "unpublish", "delete", "schedule", "discardChanges", "restore"]);
const SYSTEM_DOCUMENT_TYPES = new Set(["seoSuggestion", "researchSnapshot", "auditLog"]);
const OWNER_HIDDEN_DOCUMENT_TYPES = new Set(["category", ...SYSTEM_DOCUMENT_TYPES]);

type StudioAuthProvider = { name: string };
type StudioNewDocumentOption = { templateId: string };
type StudioStructureItem = { getId: () => string | undefined };

export function filterStudioAuthProviders<T extends StudioAuthProvider>(
  providers: T[],
  dataset: string,
  environment: AdminEnvironment,
  projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
): T[] {
  if (!isStudioDataPlaneAllowed(dataset, environment, undefined, undefined, projectId)) return [];
  return environment === "production-admin" ? providers : providers.filter(({ name }) => name === "google");
}

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

export function filterStudioDocumentActions<T extends { action?: string }>(
  actions: T[],
  dataset: string,
  environment: AdminEnvironment,
  schemaType?: string,
  projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
): T[] {
  if (!isStudioDataPlaneAllowed(dataset, environment, undefined, undefined, projectId)) return [];
  if (schemaType && SYSTEM_DOCUMENT_TYPES.has(schemaType)) return [];
  if (environment === "local-production") {
    if (schemaType !== "article") return [];
    return actions.filter(({ action }) => Boolean(action && LOCAL_PRODUCTION_ARTICLE_ACTIONS.has(action)));
  }
  if (environment === "production-admin") {
    return actions.filter(({ action }) => !action || !BLOCKED_PRODUCTION_ADMIN_ACTIONS.has(action));
  }
  return actions.filter(({ action }) => !action || !BLOCKED_NON_PRODUCTION_ACTIONS.has(action));
}

export function createDraftOnlyDeleteAction(originalAction: DocumentActionComponent): DocumentActionComponent {
  const DraftOnlyDeleteAction: DocumentActionComponent = (props) => {
    const result = originalAction(props);
    if (props.published) return null;
    if (!result) return null;
    return { ...result, label: "ลบฉบับร่าง", title: "ลบฉบับร่าง", tone: "critical" };
  };
  DraftOnlyDeleteAction.action = "delete";
  DraftOnlyDeleteAction.displayName = "CCPunDraftOnlyDeleteAction";
  return DraftOnlyDeleteAction;
}

export function protectLocalProductionDestructiveActions(
  actions: DocumentActionComponent[],
  environment: AdminEnvironment,
): DocumentActionComponent[] {
  if (environment !== "local-production") return actions;
  return actions.map((action) => action.action === "delete" ? createDraftOnlyDeleteAction(action) : action);
}

export function filterStudioNewDocumentOptions<T extends StudioNewDocumentOption>(
  options: T[],
  dataset: string,
  environment: AdminEnvironment,
  projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
): T[] {
  if (!isStudioDataPlaneAllowed(dataset, environment, undefined, undefined, projectId)) return [];
  if (environment === "local-production") return options.filter(({ templateId }) => templateId === "article");
  return options.filter(({ templateId }) => !OWNER_HIDDEN_DOCUMENT_TYPES.has(templateId));
}

export function filterStudioStructureItems<T extends StudioStructureItem>(items: T[]): T[] {
  return items.filter((item) => {
    const documentType = item.getId();
    if (!documentType) return false;
    return !OWNER_HIDDEN_DOCUMENT_TYPES.has(documentType);
  });
}
