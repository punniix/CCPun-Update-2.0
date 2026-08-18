import { defineArrayMember, defineField, defineType } from "sanity";

const reviewStatuses = [
  { title: "Drafting", value: "drafting" },
  { title: "Content review", value: "content-review" },
  { title: "Fact check", value: "fact-check" },
  { title: "Compliance review", value: "compliance-review" },
  { title: "Ready for COO", value: "ready-for-coo" },
  { title: "Approved", value: "approved" },
];

const faqItem = defineType({
  name: "faqItem",
  title: "FAQ item",
  type: "object",
  fields: [
    defineField({ name: "question", title: "Question", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "answer", title: "Answer", type: "text", rows: 4, validation: (Rule) => Rule.required() }),
  ],
});

const sourceReference = defineType({
  name: "sourceReference",
  title: "Source / reference",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "url", title: "URL", type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }) }),
    defineField({ name: "publisher", title: "Publisher", type: "string" }),
    defineField({ name: "accessedAt", title: "Accessed date", type: "date" }),
  ],
});

const reviewMetadata = defineType({
  name: "reviewMetadata",
  title: "Review workflow",
  type: "object",
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "drafting",
      options: { list: reviewStatuses, layout: "dropdown" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "contentReviewedAt", title: "Content reviewed at", type: "datetime" }),
    defineField({ name: "factCheckedAt", title: "Fact checked at", type: "datetime" }),
    defineField({ name: "complianceReviewedAt", title: "Compliance reviewed at", type: "datetime" }),
    defineField({ name: "notes", title: "Internal notes", type: "text", rows: 4 }),
  ],
});

const seoMetadata = defineType({
  name: "seoMetadata",
  title: "SEO metadata",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "SEO title",
      type: "string",
      validation: (Rule) => Rule.required().max(60).warning("Recommended: 45–60 characters"),
    }),
    defineField({
      name: "description",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().max(160).warning("Recommended: 130–160 characters"),
    }),
    defineField({
      name: "canonical",
      title: "Canonical override",
      description: "Leave blank to use https://ccpun.com/blog/{slug}/",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "noindex",
      title: "Keep published page out of search",
      type: "boolean",
      initialValue: false,
    }),
  ],
});

const geoMetadata = defineType({
  name: "geoMetadata",
  title: "GEO metadata",
  type: "object",
  fields: [
    defineField({ name: "summary", title: "Summary", type: "text", rows: 3 }),
    defineField({ name: "keyEntities", title: "Key entities", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "keyQuestions", title: "Key questions", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "reviewedAt", title: "Reviewed at", type: "datetime" }),
  ],
});

const imageWithAlt = defineType({
  name: "imageWithAlt",
  title: "Image with alt text",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({ name: "alt", title: "Alt text", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({ name: "credit", title: "Credit", type: "string" }),
  ],
});

const callout = defineType({
  name: "callout",
  title: "Callout",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "text", title: "Text", type: "text", rows: 4, validation: (Rule) => Rule.required() }),
  ],
});

const portableText = defineType({
  name: "portableText",
  title: "Article body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
    }),
    defineArrayMember({ type: "callout" }),
  ],
});

const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "bio", title: "Bio", type: "text", rows: 4 }),
    defineField({ name: "credentials", title: "Credentials", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "sameAs",
      title: "Profile URLs",
      type: "array",
      of: [defineArrayMember({ type: "url", validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }) })],
    }),
  ],
  preview: { select: { title: "name", subtitle: "slug.current" } },
});

const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});

const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seoGeo", title: "SEO / GEO" },
    { name: "review", title: "Sources / review" },
    { name: "publication", title: "Publication" },
  ],
  fields: [
    defineField({ name: "title", title: "Title", type: "string", group: "content", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 4,
      group: "content",
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({ name: "category", title: "Category", type: "reference", to: [{ type: "category" }], group: "content", validation: (Rule) => Rule.required() }),
    defineField({ name: "tags", title: "Tags", type: "array", of: [defineArrayMember({ type: "string" })], group: "content", options: { layout: "tags" } }),
    defineField({ name: "author", title: "Author", type: "reference", to: [{ type: "author" }], group: "content", validation: (Rule) => Rule.required() }),
    defineField({ name: "featuredImage", title: "Featured image", type: "imageWithAlt", group: "content" }),
    defineField({ name: "body", title: "Body", type: "portableText", group: "content", validation: (Rule) => Rule.required().min(1) }),
    defineField({ name: "faq", title: "Visible FAQ", type: "array", of: [defineArrayMember({ type: "faqItem" })], group: "content" }),
    defineField({ name: "sources", title: "Sources", type: "array", of: [defineArrayMember({ type: "sourceReference" })], group: "review" }),
    defineField({ name: "review", title: "Review workflow", type: "reviewMetadata", group: "review", validation: (Rule) => Rule.required() }),
    defineField({ name: "seo", title: "SEO", type: "seoMetadata", group: "seoGeo", validation: (Rule) => Rule.required() }),
    defineField({ name: "geo", title: "GEO", type: "geoMetadata", group: "seoGeo" }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      group: "publication",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const id = String(context.document?._id ?? "");
          return id.startsWith("drafts.") || value ? true : "Published documents require a published date";
        }),
    }),
  ],
  orderings: [{ title: "Updated, newest", name: "updatedDesc", by: [{ field: "_updatedAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", subtitle: "review.status", media: "featuredImage" },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle: subtitle ? `Review: ${subtitle}` : "Review status missing", media }),
  },
});

export const schemaTypes = [
  article,
  author,
  category,
  faqItem,
  sourceReference,
  reviewMetadata,
  seoMetadata,
  geoMetadata,
  imageWithAlt,
  callout,
  portableText,
];
