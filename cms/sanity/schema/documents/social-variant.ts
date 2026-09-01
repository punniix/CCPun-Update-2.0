import { defineArrayMember, defineField, defineType } from "sanity";

const channelOptions = ["facebook", "instagram", "youtube", "tiktok", "facebook-group"];
const formatOptions = ["text-post", "link-post", "image-post", "album", "carousel", "reel", "video", "short", "photo-post", "live"];
const publishingModeOptions = ["direct", "native-scheduled", "native-finish", "tiktok-draft", "assisted-distribution"];

export const socialVariant = defineType({
  name: "socialVariant",
  title: "Social Channel Variant (Draft only)",
  type: "document",
  fields: [
    defineField({
      name: "masterContent",
      title: "Master Content",
      type: "reference",
      to: [{ type: "masterContent" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "ชื่อภายใน",
      type: "string",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "channel",
      title: "Channel",
      type: "string",
      options: { list: channelOptions },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "format",
      title: "Format",
      type: "string",
      options: { list: formatOptions },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "version",
      title: "Version",
      type: "number",
      initialValue: 1,
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({ name: "caption", title: "Caption", type: "text", rows: 6 }),
    defineField({ name: "script", title: "Script", type: "text", rows: 10 }),
    defineField({
      name: "linkUrl",
      title: "HTTPS Link URL",
      type: "url",
      hidden: ({ document }) => document?.format !== "link-post",
      validation: (Rule) => Rule.custom((value, context) => {
        const isLinkPost = context.document?.format === "link-post";
        if (isLinkPost && context.document?.channel !== "facebook") return "Link Post ใช้ได้กับ Facebook เท่านั้น";
        if (isLinkPost && !value) return "Link Post ต้องระบุ HTTPS URL แยกจาก Caption";
        if (!isLinkPost && value) return "Link URL ใช้ได้กับรูปแบบ Link Post เท่านั้น";
        if (!value) return true;
        try {
          return new URL(String(value)).protocol === "https:" ? true : "Link URL ต้องใช้ HTTPS เท่านั้น";
        } catch {
          return "Link URL ไม่ถูกต้อง";
        }
      }),
    }),
    defineField({
      name: "mediaReferences",
      title: "Selected Media",
      type: "array",
      validation: (Rule) => Rule.max(20),
      of: [defineArrayMember({
        type: "object",
        fields: [
          defineField({ name: "assetId", title: "Media Asset ID", type: "string", validation: (Rule) => Rule.required().max(120) }),
          defineField({
            name: "role",
            title: "Role",
            type: "string",
            options: { list: ["primary", "carousel-item", "cover", "thumbnail", "caption"] },
            validation: (Rule) => Rule.required(),
          }),
          defineField({ name: "order", title: "Carousel Order", type: "number", validation: (Rule) => Rule.integer().min(1).max(20) }),
          defineField({ name: "mimeType", title: "MIME Type", type: "string", readOnly: true }),
          defineField({
            name: "sha256Checksum",
            title: "SHA-256 Checksum",
            type: "string",
            readOnly: true,
            validation: (Rule) => Rule.regex(/^[0-9a-f]{64}$/),
          }),
          defineField({ name: "widthPx", title: "Width", type: "number", readOnly: true }),
          defineField({ name: "heightPx", title: "Height", type: "number", readOnly: true }),
          defineField({ name: "durationMs", title: "Duration", type: "number", readOnly: true }),
        ],
      })],
    }),
    defineField({
      name: "commentSeriesMode",
      title: "รูปแบบ Comment Series",
      type: "string",
      initialValue: "top-level",
      options: {
        list: [
          { title: "แยกเป็นคอมเมนต์หลัก", value: "top-level" },
          { title: "ต่อเป็น Thread", value: "threaded" },
        ],
      },
      hidden: ({ document }) => document?.channel !== "facebook",
      validation: (Rule) => Rule.custom((value, context) => (
        context.document?.channel !== "facebook" && value && value !== "top-level"
          ? "Comment Series ใช้ได้กับ Facebook Main Post เท่านั้น"
          : true
      )),
    }),
    defineField({
      name: "commentSeries",
      title: "Comment Series",
      type: "array",
      of: [defineArrayMember({ type: "socialCommentSeriesItem" })],
      hidden: ({ document }) => document?.channel !== "facebook",
      validation: (Rule) => Rule.max(20).custom((items, context) => {
        if (context.document?.channel !== "facebook" && Array.isArray(items) && items.length > 0) {
          return "Comment Series ใช้ได้กับ Facebook Main Post เท่านั้น";
        }
        const positions = Array.isArray(items)
          ? items.map((item) => item && typeof item === "object" && "position" in item ? item.position : null)
          : [];
        return new Set(positions).size === positions.length ? true : "ลำดับ Comment ต้องไม่ซ้ำ";
      }),
    }),
    defineField({
      name: "publishingMode",
      title: "Publishing Mode",
      type: "string",
      options: { list: publishingModeOptions },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "review",
      title: "ขั้นตรวจเนื้อหา",
      type: "reviewMetadata",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
