import { defineArrayMember, defineField, defineType } from "sanity";

const suggestionStatuses = [
  { title: "Proposed", value: "proposed" },
  { title: "Automated review", value: "automated-review" },
  { title: "Needs human review", value: "needs-human-review" },
  { title: "Approved", value: "approved" },
  { title: "Applied to Draft", value: "applied" },
  { title: "Rejected", value: "rejected" },
  { title: "Published", value: "published" },
];

const riskLevels = [
  { title: "Low", value: "low" },
  { title: "Medium", value: "medium" },
  { title: "High", value: "high" },
  { title: "Critical", value: "critical" },
];

export const seoEvidence = defineType({
  name: "seoEvidence",
  title: "SEO evidence",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "sourceType",
      title: "Source type",
      type: "string",
      options: {
        list: [
          { title: "First-party analytics", value: "first-party" },
          { title: "Research provider", value: "provider" },
          { title: "SERP", value: "serp" },
          { title: "Competitor", value: "competitor" },
          { title: "Deterministic audit", value: "audit" },
          { title: "Manual note", value: "manual" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "url", title: "Evidence URL", type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }) }),
    defineField({ name: "detail", title: "Evidence detail", type: "text", rows: 3 }),
    defineField({ name: "capturedAt", title: "Captured at", type: "datetime" }),
  ],
});

export const seoSuggestion = defineType({
  name: "seoSuggestion",
  title: "SEO Suggestion",
  type: "document",
  fields: [
    defineField({
      name: "targetDocument",
      title: "Target article",
      type: "reference",
      readOnly: true,
      to: [{ type: "article" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      title: "Suggestion type",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "SEO title", value: "seo-title" },
          { title: "Meta description", value: "meta-description" },
          { title: "Primary keyword", value: "primary-keyword" },
          { title: "Secondary keywords", value: "secondary-keywords" },
          { title: "Search intent", value: "search-intent" },
          { title: "Heading / structure", value: "structure" },
          { title: "Internal links", value: "internal-links" },
          { title: "Content improvement", value: "content" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "before", title: "Before", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "after", title: "Proposed after", type: "text", rows: 4, readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "targetRevision", title: "Target revision at proposal", type: "string", readOnly: true }),
    defineField({ name: "approvedAfter", title: "Approved value", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "approvedBaseValue", title: "Approved base value", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "approvedTargetRevision", title: "Approved target revision", type: "string", readOnly: true }),
    defineField({ name: "approvedType", title: "Approved suggestion type", type: "string", readOnly: true }),
    defineField({ name: "approvedRiskLevel", title: "Approved risk level", type: "string", readOnly: true }),
    defineField({ name: "approvedTargetId", title: "Approved target ID", type: "string", readOnly: true }),
    defineField({ name: "reason", title: "Reason", type: "text", rows: 4, readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "evidence", title: "Evidence", type: "array", readOnly: true, of: [defineArrayMember({ type: "seoEvidence" })] }),
    defineField({
      name: "confidence",
      title: "Confidence",
      type: "number",
      readOnly: true,
      description: "0.00–1.00",
      validation: (Rule) => Rule.required().min(0).max(1),
    }),
    defineField({
      name: "riskLevel",
      title: "Risk level",
      type: "string",
      readOnly: true,
      options: { list: riskLevels },
      initialValue: "low",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      readOnly: true,
      options: { list: suggestionStatuses },
      initialValue: "proposed",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "createdBy", title: "Created by", type: "string", readOnly: true }),
    defineField({ name: "reviewedBy", title: "Reviewed by", type: "string", readOnly: true }),
    defineField({ name: "editedBy", title: "Edited by", type: "string", readOnly: true }),
    defineField({ name: "rejectionReason", title: "Rejection reason", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "appliedBy", title: "Applied by", type: "string", readOnly: true }),
    defineField({ name: "createdAt", title: "Created at", type: "datetime", readOnly: true }),
    defineField({ name: "reviewedAt", title: "Reviewed at", type: "datetime", readOnly: true }),
    defineField({ name: "editedAt", title: "Edited at", type: "datetime", readOnly: true }),
    defineField({ name: "appliedAt", title: "Applied at", type: "datetime", readOnly: true }),
    defineField({ name: "publishedAt", title: "Published at", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Newest", name: "newest", by: [{ field: "createdAt", direction: "desc" }] }],
  preview: {
    select: { title: "targetDocument.title", subtitle: "status" },
    prepare: ({ title, subtitle }) => ({ title: title || "SEO suggestion", subtitle: subtitle ? `Status: ${subtitle}` : undefined }),
  },
});

export const serpResult = defineType({
  name: "serpResult",
  title: "SERP result",
  type: "object",
  fields: [
    defineField({ name: "position", title: "Position", type: "number" }),
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "url", title: "URL", type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }) }),
    defineField({ name: "domain", title: "Domain", type: "string" }),
    defineField({ name: "snippet", title: "Snippet", type: "text", rows: 3 }),
  ],
});

export const researchSnapshot = defineType({
  name: "researchSnapshot",
  title: "Research Snapshot",
  type: "document",
  fields: [
    defineField({ name: "keyword", title: "Keyword", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "keywordKey", title: "Normalized keyword key", type: "string", readOnly: true, hidden: true }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "Ubersuggest", value: "ubersuggest" },
          { title: "Google Search Console", value: "gsc" },
          { title: "SERP research", value: "serp" },
          { title: "Manual research", value: "manual" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "scope", title: "Location / scope", type: "string", readOnly: true }),
    defineField({ name: "location", title: "Location", type: "string", readOnly: true }),
    defineField({ name: "language", title: "Language", type: "string", readOnly: true }),
    defineField({ name: "volume", title: "Search volume", type: "number", readOnly: true, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "difficulty", title: "Difficulty", type: "number", readOnly: true, validation: (Rule) => Rule.min(0).max(100) }),
    defineField({
      name: "intent",
      title: "Search intent",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "Informational", value: "informational" },
          { title: "Commercial", value: "commercial" },
          { title: "Transactional", value: "transactional" },
          { title: "Navigational", value: "navigational" },
          { title: "Mixed", value: "mixed" },
        ],
      },
    }),
    defineField({ name: "serp", title: "SERP", type: "array", readOnly: true, of: [defineArrayMember({ type: "serpResult" })] }),
    defineField({ name: "competitors", title: "Competitors", type: "array", readOnly: true, of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "trustClass",
      title: "Trust classification",
      type: "string",
      readOnly: true,
      initialValue: "untrusted-external-data",
      options: { list: [{ title: "Untrusted external data", value: "untrusted-external-data" }] },
    }),
    defineField({ name: "checkedAt", title: "Checked at", type: "datetime", readOnly: true, validation: (Rule) => Rule.required() }),
  ],
  orderings: [{ title: "Checked, newest", name: "checkedDesc", by: [{ field: "checkedAt", direction: "desc" }] }],
});

export const auditLog = defineType({
  name: "auditLog",
  title: "Admin Audit Log",
  type: "document",
  fields: [
    defineField({ name: "actor", title: "Actor", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({
      name: "actorType",
      title: "Actor type",
      type: "string",
      readOnly: true,
      options: { list: ["human", "ai", "system"] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "action", title: "Action", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "objectType", title: "Object type", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "objectId", title: "Object ID", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "before", title: "Before (redacted JSON)", type: "text", rows: 5, readOnly: true }),
    defineField({ name: "after", title: "After (redacted JSON)", type: "text", rows: 5, readOnly: true }),
    defineField({ name: "requestId", title: "Request ID", type: "string", readOnly: true }),
    defineField({ name: "environment", title: "Environment", type: "string", readOnly: true }),
    defineField({ name: "timestamp", title: "Timestamp", type: "datetime", readOnly: true, validation: (Rule) => Rule.required() }),
  ],
  orderings: [{ title: "Newest", name: "newest", by: [{ field: "timestamp", direction: "desc" }] }],
  preview: {
    select: { title: "action", actor: "actor", timestamp: "timestamp" },
    prepare: ({ title, actor, timestamp }) => ({
      title: title || "Audit event",
      subtitle: [actor, timestamp].filter(Boolean).join(" · "),
    }),
  },
});

export const seoAuditSnapshot = defineType({
  name: "seoAuditSnapshot",
  title: "SEO audit snapshot",
  type: "object",
  fields: [
    defineField({ name: "version", title: "Audit version", type: "number", readOnly: true }),
    defineField({ name: "score", title: "Score", type: "number", validation: (Rule) => Rule.min(0).max(100) }),
    defineField({ name: "criticalIssues", title: "Critical issues", type: "number", validation: (Rule) => Rule.min(0) }),
    defineField({ name: "warnings", title: "Warnings", type: "number", validation: (Rule) => Rule.min(0) }),
    defineField({ name: "passedChecks", title: "Passed checks", type: "number", validation: (Rule) => Rule.min(0) }),
    defineField({ name: "summary", title: "Audit summary", type: "text", rows: 3 }),
    defineField({ name: "auditedAt", title: "Audited at", type: "datetime" }),
    defineField({ name: "sourceRevision", title: "Source revision", type: "string" }),
    defineField({ name: "geoVersion", title: "GEO audit version", type: "number", readOnly: true }),
    defineField({ name: "geoPassedChecks", title: "GEO checks passed", type: "number", readOnly: true, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "geoTotalChecks", title: "GEO checks total", type: "number", readOnly: true, validation: (Rule) => Rule.min(0) }),
    defineField({ name: "geoAuditedAt", title: "GEO audited at", type: "datetime", readOnly: true }),
  ],
});

export const adminSchemaTypes = [seoEvidence, seoAuditSnapshot, seoSuggestion, serpResult, researchSnapshot, auditLog];
