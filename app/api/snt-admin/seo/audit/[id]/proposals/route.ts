import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminEnvironment } from "@/lib/admin/environment";
import { getAdminIdentity } from "@/lib/admin/identity";
import { evaluateAdminAction } from "@/lib/admin/policy";
import { createSeoSuggestion } from "@/lib/admin/sanity-control";
import { runSeoAudit } from "@/lib/admin/seo-audit";
import { generateEvidenceBasedSeoProposals, SeoProposalError } from "@/lib/admin/seo-ai";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const policy = evaluateAdminAction({
    actorType: identity.actorType,
    role: identity.role,
    action: "proposal:create",
    environment: getAdminEnvironment(),
  });
  if (!policy.allowed) {
    return NextResponse.json({ error: "forbidden", reason: policy.reason }, { status: 403 });
  }

  const { id } = await context.params;
  const requestId = randomUUID();

  try {
    // Proposal generation must not mutate the article revision used for idempotency.
    const [audit, generated] = await Promise.all([
      runSeoAudit(id, false),
      generateEvidenceBasedSeoProposals(id),
    ]);
    if (audit.sourceRevision !== generated.sourceRevision) throw new Error("PROPOSAL_SOURCE_STALE");
    if (!generated.proposals.length) return NextResponse.json({ error: "no-safe-proposal", requestId }, { status: 422 });

    const created = [];
    for (const proposal of generated.proposals) {
      const suggestion = await createSeoSuggestion(
        {
          targetDocumentId: id,
          type: proposal.type,
          after: proposal.after,
          reason: proposal.reason,
          confidence: proposal.confidence,
          riskLevel: proposal.riskLevel,
          createdBy: "ccpun-seo-ai",
        },
        {
          actorType: "ai",
          requestId,
          idempotentForAuditRevision: true,
          expectedTargetRevision: audit.sourceRevision,
        },
      );
      created.push({ id: suggestion._id, type: proposal.type, status: suggestion.status });
    }

    return NextResponse.json({
      audit,
      proposals: created,
      evidence: {
        focusKeyword: generated.focusKeyword,
        researchCount: generated.researchCount,
        ownerUrl: generated.ownerUrl,
      },
      requestId,
    });
  } catch (error) {
    if (error instanceof SeoProposalError) {
      if (error.code === "SEO_AI_NOT_CONFIGURED") {
        return NextResponse.json({ error: "seo-ai-not-configured", requestId }, { status: 503 });
      }
      if (error.code === "PRIMARY_KEYWORD_REQUIRED") {
        return NextResponse.json({ error: "primary-keyword-required", requestId }, { status: 422 });
      }
      if (error.code === "SEO_RESEARCH_REQUIRED") {
        return NextResponse.json({ error: "seo-research-required", requestId }, { status: 422 });
      }
      if (error.code === "KEYWORD_OWNER_CONFLICT") {
        return NextResponse.json({ error: "keyword-owner-conflict", ownerUrl: error.details?.ownerUrl, requestId }, { status: 409 });
      }
      if (error.code === "SEO_AI_INVALID_OUTPUT") {
        return NextResponse.json({ error: "seo-ai-invalid-output", requestId }, { status: 502 });
      }
      return NextResponse.json({ error: "seo-ai-provider-failed", requestId }, { status: 502 });
    }
    if (error instanceof Error && error.message === "ARTICLE_NOT_FOUND") {
      return NextResponse.json({ error: "article-not-found", requestId }, { status: 404 });
    }
    if (error instanceof Error && error.message === "TARGET_DRAFT_NOT_FOUND") {
      return NextResponse.json({ error: "target-draft-not-found", requestId }, { status: 404 });
    }
    if (error instanceof Error && error.message === "PROPOSAL_SOURCE_STALE") {
      return NextResponse.json({ error: "proposal-source-stale", requestId }, { status: 409 });
    }
    return NextResponse.json({ error: "proposal-generation-failed", requestId }, { status: 502 });
  }
}
