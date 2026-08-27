import type { AdminEnvironment } from "./environment";
import { isAdminMutationEnvironment, isLocalProductionDraftWriteEnabled } from "./environment";
import type { AdminRole } from "./rbac";
import { hasAdminPermission } from "./rbac";

export const ADMIN_ACTIONS = [
  "dashboard:read",
  "content:read",
  "proposal:create",
  "seo:audit",
  "research:create",
  "review:approve",
  "review:edit",
  "review:reject",
  "draft:apply",
  "content:publish",
  "content:delete",
  "seo:canonical-change",
  "seo:redirect-change",
  "seo:noindex-change",
  "production:config-change",
  "production:deploy",
  "dns:change",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];
export type AdminActorType = "human" | "ai" | "system";

export type AdminPolicyDecision = {
  allowed: boolean;
  reason: string;
};

const HARD_DENY_ACTIONS = new Set<AdminAction>([
  "content:publish",
  "content:delete",
  "seo:canonical-change",
  "seo:redirect-change",
  "seo:noindex-change",
  "production:config-change",
  "production:deploy",
  "dns:change",
]);

export function evaluateAdminAction(input: {
  actorType: AdminActorType;
  role: AdminRole | null;
  action: AdminAction;
  environment: AdminEnvironment;
}): AdminPolicyDecision {
  const { actorType, role, action, environment } = input;

  if (HARD_DENY_ACTIONS.has(action)) {
    return {
      allowed: false,
      reason: "Action is outside the CCPun Admin & Intelligence Layer permission boundary.",
    };
  }

  if (!role && actorType === "human") {
    return { allowed: false, reason: "Authenticated Admin role required." };
  }

  if (
    environment === "local-production" &&
    action !== "dashboard:read" &&
    action !== "content:read"
  ) {
    const draftWorkflowAction = ["seo:audit", "proposal:create", "research:create", "review:approve", "review:edit", "review:reject", "draft:apply"].includes(action);
    if (!isLocalProductionDraftWriteEnabled(environment) || !draftWorkflowAction || actorType !== "human" || role !== "owner") {
      return { allowed: false, reason: "Local Production permits only the authenticated owner Draft workflow when explicitly enabled." };
    }
  }

  if (action === "dashboard:read" || action === "content:read") {
    const permission = action === "dashboard:read" ? "dashboard:read" : "content:read";
    return hasAdminPermission(role, permission)
      ? { allowed: true, reason: "Role has read permission." }
      : { allowed: false, reason: "Role does not have read permission." };
  }

  if (action === "seo:audit") {
    if (actorType === "ai" || actorType === "system") {
      return { allowed: true, reason: "Automated actors may run deterministic SEO audits but cannot approve or publish." };
    }

    return hasAdminPermission(role, "seo:read")
      ? { allowed: true, reason: "Role may run SEO audits." }
      : { allowed: false, reason: "Role cannot run SEO audits." };
  }

  if (action === "proposal:create") {
    if (actorType === "ai") {
      return { allowed: true, reason: "AI may generate proposals but cannot approve or publish them." };
    }

    return hasAdminPermission(role, "content:propose") || hasAdminPermission(role, "seo:propose")
      ? { allowed: true, reason: "Role may create proposals." }
      : { allowed: false, reason: "Role cannot create proposals." };
  }

  if (action === "research:create") {
    if (actorType === "ai") {
      return { allowed: true, reason: "AI may create normalized research outputs." };
    }

    return hasAdminPermission(role, "research:create")
      ? { allowed: true, reason: "Role may create research snapshots." }
      : { allowed: false, reason: "Role cannot create research snapshots." };
  }

  if (action === "review:approve" || action === "review:edit" || action === "review:reject") {
    if (actorType !== "human") {
      return { allowed: false, reason: "Only a human reviewer may decide a proposal." };
    }

    const permission = action === "review:approve"
      ? "reviews:approve"
      : action === "review:edit"
        ? "reviews:edit"
        : "reviews:reject";
    return hasAdminPermission(role, permission)
      ? { allowed: true, reason: "Human reviewer may decide a proposal." }
      : { allowed: false, reason: "Role cannot decide proposals." };
  }

  if (action === "draft:apply") {
    if (actorType !== "human") {
      return { allowed: false, reason: "AI/system actors cannot apply draft mutations." };
    }

    if (!isAdminMutationEnvironment(environment)) {
      return { allowed: false, reason: "Draft mutations fail closed outside an approved Admin lane." };
    }

    return hasAdminPermission(role, "draft:apply")
      ? { allowed: true, reason: "Human owner may apply an approved proposal to a draft." }
      : { allowed: false, reason: "Role cannot apply draft mutations." };
  }

  return { allowed: false, reason: "No policy rule grants this action." };
}
