import { defineArrayMember, defineField, defineType } from "sanity";
import { ACTIVE_ARTICLE_CATEGORIES, isReservedArticleSlug } from "../../lib/content/taxonomy";
import SeoScoreInput from "./components/SeoScoreInput";
import { adminSchemaTypes } from "./adminTypes";

const activeArticleCategorySlugs = ACTIVE_ARTICLE_CATEGORIES.map(({ slug }) => slug);

const reviewStatuses = [
  { title: "กำลังเขียน", value: "drafting" },
  { title: "กำลังตรวจเนื้อหา", value: "content-review" },
  { title: "กำลังตรวจข้อเท็จจริง", value: "fact-check" },
  { title: "กำลังตรวจข้อกำหนดและกฎหมาย", value: "compliance-review" },
  { title: "พร้อมให้คุณอนุมัติ", value: "ready-for-coo" },
  { title: "อนุมัติเนื้อหาแล้ว", value: "approved" },
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
  title: "ขั้นตรวจเนื้อหา",
  type: "object",
  fields: [
    defineField({
      name: "status",
      title: "สถานะการตรวจเนื้อหา",
      type: "string",
      initialValue: "drafting",
      options: { list: reviewStatuses, layout: "dropdown" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "contentReviewedAt", title: "ตรวจเนื้อหาเมื่อ", type: "datetime" }),
    defineField({ name: "factCheckedAt", title: "ตรวจข้อเท็จจริงเมื่อ", type: "datetime" }),
    defineField({ name: "complianceReviewedAt", title: "ตรวจข้อกำหนดและกฎหมายเมื่อ", type: "datetime" }),
    defineField({ name: "notes", title: "บันทึกภายใน", type: "text", rows: 4 }),
  ],
});

const migrationSource = defineType({
  name: "migrationSource",
  title: "Migration source",
  type: "object",
  fields: [
    defineField({ name: "platform", title: "Platform", type: "string", readOnly: true }),
    defineField({ name: "sourceId", title: "Source ID", type: "number", readOnly: true }),
    defineField({ name: "sourceStatus", title: "Source status", type: "string", readOnly: true }),
    defineField({ name: "sourceRevision", title: "Source revision", type: "string", readOnly: true }),
    defineField({ name: "disposition", title: "Migration disposition", type: "string", readOnly: true }),
    defineField({ name: "sourceCreatedAt", title: "Source created at", type: "datetime", readOnly: true }),
    defineField({ name: "sourceModifiedAt", title: "Source modified at", type: "datetime", readOnly: true }),
    defineField({ name: "importedAt", title: "Imported at", type: "datetime", readOnly: true }),
    defineField({ name: "sourceHtml", title: "Original WordPress body", type: "text", rows: 12, readOnly: true }),
    defineField({ name: "sourceExcerptHtml", title: "Original WordPress excerpt", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "sourceCategories", title: "Original categories", type: "array", of: [defineArrayMember({ type: "string" })], readOnly: true }),
    defineField({ name: "sourceTags", title: "Original tags", type: "array", of: [defineArrayMember({ type: "string" })], readOnly: true }),
    defineField({ name: "rankMathTitle", title: "Original Rank Math title", type: "string", readOnly: true }),
    defineField({ name: "rankMathDescription", title: "Original Rank Math description", type: "text", rows: 3, readOnly: true }),
    defineField({ name: "rankMathFocusKeyword", title: "Original Rank Math focus keyword", type: "string", readOnly: true }),
    defineField({ name: "rankMathCanonical", title: "Original Rank Math canonical", type: "url", readOnly: true }),
    defineField({ name: "rankMathRobots", title: "Original Rank Math robots", type: "string", readOnly: true }),
    defineField({ name: "featuredImageUrl", title: "Original featured image URL", type: "url", readOnly: true }),
    defineField({ name: "featuredImageAlt", title: "Original featured image alt", type: "string", readOnly: true }),
    defineField({ name: "featuredImageCaption", title: "Original featured image caption", type: "text", rows: 3, readOnly: true }),
  ],
});

const seoMetadata = defineType({
  name: "seoMetadata",
  title: "SEO metadata",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "ชื่อสำหรับ Google (SEO Title — ไม่กรอกก็ได้)",
      description: "เว้นว่างเพื่อใช้ชื่อบทความอัตโนมัติ กรอกเฉพาะเมื่อต้องการให้ชื่อบน Google ต่างจากหน้าเว็บ",
      type: "string",
      validation: (Rule) => Rule.max(60).warning("แนะนำไม่เกิน 60 ตัวอักษร"),
    }),
    defineField({
      name: "description",
      title: "คำอธิบายใน Google (Meta Description)",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().max(160).warning("Recommended: 130–160 characters"),
    }),
    defineField({
      name: "focusKeyword",
      title: "คำค้นหลัก",
      description: "คำที่ต้องการให้บทความนี้ตอบโจทย์เป็นหลัก ใช้เป็นข้อมูลเดียวกับคะแนน SEO เดิม",
      type: "string",
    }),
    defineField({
      name: "secondaryKeywords",
      title: "คำค้นรอง",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "searchIntent",
      title: "เป้าหมายการค้นหา",
      type: "string",
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
    defineField({
      name: "auditSnapshot",
      title: "Latest SEO audit",
      type: "seoAuditSnapshot",
      readOnly: true,
    }),
    defineField({
      name: "canonical",
      title: "Canonical override",
      description: "Leave blank to use https://ccpun.com/blog/{category-slug}/{slug}/",
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
  title: "รูปภาพ พร้อม Alt text",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({ name: "alt", title: "Alt text", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({ name: "credit", title: "Credit", type: "string" }),
  ],
});

const migratedImage = defineType({
  name: "migratedImage",
  title: "Migrated image",
  type: "object",
  fields: [
    defineField({ name: "src", title: "Source path", type: "string", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "alt", title: "Alt text", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "width", title: "Width", type: "number", readOnly: true, validation: (Rule) => Rule.required().positive() }),
    defineField({ name: "height", title: "Height", type: "number", readOnly: true, validation: (Rule) => Rule.required().positive() }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
  ],
});

const tableRow = defineType({
  name: "tableRow",
  title: "Table row",
  type: "object",
  fields: [
    defineField({ name: "cells", title: "Cells", type: "array", of: [defineArrayMember({ type: "string" })] }),
  ],
});

const simpleTable = defineType({
  name: "simpleTable",
  title: "ตาราง",
  type: "object",
  fields: [
    defineField({ name: "headers", title: "Headers", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      of: [defineArrayMember({ type: "tableRow" })],
    }),
  ],
});

const divider = defineType({
  name: "divider",
  title: "Divider",
  type: "object",
  fields: [defineField({ name: "label", title: "Label", type: "string", hidden: true, initialValue: "divider" })],
});

const callout = defineType({
  name: "callout",
  title: "Callout",
  type: "object",
  fields: [
    defineField({ name: "title", title: "ชื่อบทความ", type: "string" }),
    defineField({ name: "text", title: "Text", type: "text", rows: 4, validation: (Rule) => Rule.required() }),
  ],
});

const imageGallery = defineType({
  name: "imageGallery",
  title: "แกลเลอรีรูปภาพ",
  type: "object",
  fields: [
    defineField({
      name: "images",
      title: "รูปภาพ",
      type: "array",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      validation: (Rule) => Rule.required().min(2).max(12),
    }),
  ],
  preview: { select: { media: "images.0", count: "images" }, prepare: ({ media, count }) => ({ title: `แกลเลอรี ${Array.isArray(count) ? count.length : 0} รูป`, media }) },
});

const ctaBlock = defineType({
  name: "ctaBlock",
  title: "ปุ่ม CTA",
  type: "object",
  fields: [
    defineField({ name: "label", title: "ข้อความบนปุ่ม", type: "string", validation: (Rule) => Rule.required().max(80) }),
    defineField({
      name: "url",
      title: "ลิงก์",
      type: "string",
      validation: (Rule) => Rule.required().custom((value) => !value || /^(https?:\/\/|\/(?!\/))/.test(value) ? true : "ใช้ลิงก์ https:// หรือ path ที่ขึ้นต้นด้วย / เท่านั้น"),
    }),
    defineField({
      name: "style",
      title: "รูปแบบ",
      type: "string",
      initialValue: "primary",
      options: { layout: "radio", list: [{ title: "ปุ่มหลัก", value: "primary" }, { title: "ปุ่มรอง", value: "secondary" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "openInNewTab", title: "เปิดในแท็บใหม่", type: "boolean", initialValue: false }),
  ],
});

const pdfDownload = defineType({
  name: "pdfDownload",
  title: "ไฟล์ PDF",
  type: "object",
  fields: [
    defineField({ name: "title", title: "ชื่อไฟล์ที่ผู้อ่านเห็น", type: "string", validation: (Rule) => Rule.required().max(120) }),
    defineField({ name: "description", title: "คำอธิบาย", type: "text", rows: 2 }),
    defineField({ name: "file", title: "เลือกไฟล์ PDF", type: "file", options: { accept: "application/pdf" }, validation: (Rule) => Rule.required() }),
  ],
});

const detailsBlock = defineType({
  name: "detailsBlock",
  title: "เนื้อหาเปิด–ปิด",
  type: "object",
  fields: [
    defineField({ name: "summary", title: "หัวข้อ", type: "string", validation: (Rule) => Rule.required().max(160) }),
    defineField({ name: "text", title: "เนื้อหา", type: "text", rows: 5, validation: (Rule) => Rule.required() }),
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
      marks: {
        annotations: [
          defineArrayMember({
            name: "link",
            title: "ลิงก์",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "string",
                validation: (Rule) => Rule.required().custom((value) => !value || /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/.test(value) ? true : "ใช้ https://, path ภายใน, #, mailto: หรือ tel: เท่านั้น"),
              }),
              defineField({ name: "openInNewTab", title: "เปิดในแท็บใหม่", type: "boolean", initialValue: false }),
              defineField({ name: "nofollow", title: "ไม่ส่งสัญญาณอันดับ (nofollow)", type: "boolean", initialValue: false }),
              defineField({ name: "sponsored", title: "ลิงก์โฆษณา/ผู้สนับสนุน", type: "boolean", initialValue: false }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({ type: "callout" }),
    defineArrayMember({ type: "imageWithAlt" }),
    defineArrayMember({ type: "imageGallery" }),
    defineArrayMember({ type: "ctaBlock" }),
    defineArrayMember({ type: "pdfDownload" }),
    defineArrayMember({ type: "detailsBlock" }),
    defineArrayMember({ type: "migratedImage" }),
    defineArrayMember({ type: "simpleTable" }),
    defineArrayMember({ type: "divider" }),
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
      title: "URL Slug",
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
    defineField({ name: "title", title: "ชื่อบทความ", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "URL Slug",
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
    { name: "content", title: "เขียนบทความ", default: true },
    { name: "seoGeo", title: "SEO / การค้นหา" },
    { name: "review", title: "ตรวจสอบ / แหล่งอ้างอิง" },
    { name: "publication", title: "ตัวอย่าง / สถานะเผยแพร่" },
  ],
  fields: [
    defineField({ name: "title", title: "ชื่อบทความ", type: "string", group: "content", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      group: "content",
      description: "กด Generate เพื่อสร้าง URL จากชื่อบทความ แล้วควรหลีกเลี่ยงการเปลี่ยนหลัง Publish",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom((value) =>
          isReservedArticleSlug((value as { current?: string } | undefined)?.current)
            ? "URL นี้สงวนไว้สำหรับส่งต่อหมวดหมู่เดิม กรุณาใช้ slug อื่น"
            : true,
        ),
    }),
    defineField({
      name: "excerpt",
      title: "คำอธิบายสั้น / คำโปรยบทความ",
      type: "text",
      rows: 3,
      group: "content",
      description: "ใช้ใน Blog card / search preview เท่านั้น ไม่แสดงเป็นย่อหน้าเปิดในหน้า Article",
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({
      name: "category",
      title: "หมวดหมู่หลัก",
      description: "เลือก 1 หมวดหลักเพื่อกำหนดโครงสร้างและ URL ของบทความ ส่วนหัวข้อย่อยให้ใส่เป็นแท็ก",
      type: "reference",
      to: [{ type: "category" }],
      group: "content",
      options: {
        disableNew: true,
        filter: "slug.current in $activeSlugs",
        filterParams: { activeSlugs: activeArticleCategorySlugs },
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tags",
      title: "แท็กหัวข้อย่อย",
      description: "ใช้บอกหัวข้อเฉพาะที่บทความกล่าวถึง เช่น ประกันสุขภาพ หรือ ประกันโรคร้ายแรง และใส่ได้มากกว่า 1 แท็ก",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      group: "content",
      options: { layout: "tags" },
    }),
    defineField({ name: "author", title: "ผู้เขียน", type: "reference", to: [{ type: "author" }], group: "content", validation: (Rule) => Rule.required() }),
    defineField({ name: "featuredImage", title: "รูปหน้าปกบทความ (แนะนำ 1400×600 px)", type: "imageWithAlt", group: "content", description: "กรอบหน้าเว็บใช้สัดส่วน 7:3; เลือกจุดสำคัญของภาพด้วย hotspot ได้" }),
    defineField({ name: "migratedFeaturedImage", title: "Migrated featured image", type: "migratedImage", readOnly: true, hidden: true }),
    defineField({ name: "body", title: "เนื้อหาบทความ", type: "portableText", group: "content", validation: (Rule) => Rule.required().min(1) }),
    defineField({ name: "faq", title: "FAQ ที่แสดงในบทความ", type: "array", of: [defineArrayMember({ type: "faqItem" })], group: "content" }),
    defineField({ name: "sources", title: "แหล่งอ้างอิง", type: "array", of: [defineArrayMember({ type: "sourceReference" })], group: "review" }),
    defineField({ name: "review", title: "ขั้นตรวจเนื้อหา", type: "reviewMetadata", group: "publication", validation: (Rule) => Rule.required() }),
    defineField({ name: "seo", title: "SEO หลัก + Score", type: "seoMetadata", group: "seoGeo", components: { input: SeoScoreInput }, validation: (Rule) => Rule.required() }),
    defineField({ name: "geo", title: "GEO / AI Search", type: "geoMetadata", group: "seoGeo" }),
    defineField({ name: "migration", title: "Migration source", type: "migrationSource", readOnly: true, hidden: true }),
    defineField({
      name: "contentUpdatedAt",
      title: "วันที่แก้เนื้อหาล่าสุด",
      description: "ใช้กับ Google และผู้อ่าน แยกจากเวลาที่ระบบตรวจ SEO หรือบันทึกสถานะ",
      type: "datetime",
      group: "publication",
    }),
    defineField({
      name: "publishedAt",
      title: "วันเวลาเผยแพร่",
      type: "datetime",
      group: "publication",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const id = String(context.document?._id ?? "");
          return id.startsWith("drafts.") || value ? true : "Published documents require a published date";
      }),
    }),
  ],
  validation: (Rule) =>
    Rule.custom((document) => {
      const id = String(document?._id ?? "");
      const review = document?.review as { status?: string } | undefined;
      return id.startsWith("drafts.") || review?.status === "approved"
        ? true
        : "Published documents require review status Approved";
    }),
  orderings: [{ title: "Updated, newest", name: "updatedDesc", by: [{ field: "_updatedAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", subtitle: "review.status", media: "featuredImage" },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle: subtitle ? `Review: ${subtitle}` : "Review status missing", media }),
  },
});

export const schemaTypes = [
  ...adminSchemaTypes,
  article,
  author,
  category,
  faqItem,
  sourceReference,
  reviewMetadata,
  migrationSource,
  seoMetadata,
  geoMetadata,
  imageWithAlt,
  migratedImage,
  tableRow,
  simpleTable,
  divider,
  callout,
  imageGallery,
  ctaBlock,
  pdfDownload,
  detailsBlock,
  portableText,
];
