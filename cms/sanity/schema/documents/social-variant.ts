import { defineArrayMember, defineField, defineType } from "sanity";

const channelOptions = ["facebook", "instagram", "youtube", "tiktok", "facebook-group"];
const formatOptions = ["text-post", "image-post", "album", "carousel", "reel", "video", "short", "photo-post", "live"];
const publishingModeOptions = ["direct", "native-scheduled", "native-finish", "tiktok-draft", "assisted-distribution"];

export const socialVariant = defineType({
  name: "socialVariant",
  title: "Social Channel Variant (UAT)",
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
