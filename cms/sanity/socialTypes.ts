import { defineArrayMember, defineField, defineType } from "sanity";

const channelOptions = ["facebook", "instagram", "youtube", "tiktok", "facebook-group"];
const formatOptions = ["text-post", "image-post", "carousel", "comment-series", "reel", "video", "short", "photo-post"];
const publishingModeOptions = ["direct", "native-scheduled", "native-finish", "tiktok-draft", "assisted-distribution"];

export const masterContent = defineType({
  name: "masterContent",
  title: "Master Content",
  type: "document",
  fields: [
    defineField({ name: "title", title: "หัวข้อหลัก", type: "string", validation: (Rule) => Rule.required().max(200) }),
    defineField({ name: "summary", title: "แก่นเนื้อหา", type: "text", rows: 4 }),
    defineField({ name: "semanticTopic", title: "Semantic Topic", type: "string" }),
    defineField({ name: "websiteArticle", title: "บทความเว็บไซต์", type: "reference", to: [{ type: "article" }] }),
    defineField({
      name: "variants",
      title: "Channel Variants",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "socialVariant" }] })],
    }),
    defineField({ name: "review", title: "ขั้นตรวจเนื้อหา", type: "reviewMetadata", validation: (Rule) => Rule.required() }),
  ],
});

export const socialVariant = defineType({
  name: "socialVariant",
  title: "Social Channel Variant",
  type: "document",
  fields: [
    defineField({ name: "masterContent", title: "Master Content", type: "reference", to: [{ type: "masterContent" }], validation: (Rule) => Rule.required() }),
    defineField({ name: "title", title: "ชื่อภายใน", type: "string", validation: (Rule) => Rule.required().max(200) }),
    defineField({ name: "channel", title: "Channel", type: "string", options: { list: channelOptions }, validation: (Rule) => Rule.required() }),
    defineField({ name: "format", title: "Format", type: "string", options: { list: formatOptions }, validation: (Rule) => Rule.required() }),
    defineField({ name: "version", title: "Version", type: "number", initialValue: 1, validation: (Rule) => Rule.required().integer().min(1) }),
    defineField({ name: "caption", title: "Caption", type: "text", rows: 6 }),
    defineField({ name: "script", title: "Script", type: "text", rows: 10 }),
    defineField({ name: "commentSeries", title: "Comment Series", type: "array", of: [defineArrayMember({ type: "text", rows: 4 })] }),
    defineField({ name: "mediaAssetIds", title: "Media Asset IDs", type: "array", of: [defineArrayMember({ type: "string" })], readOnly: true }),
    defineField({ name: "publishingMode", title: "Publishing Mode", type: "string", options: { list: publishingModeOptions }, validation: (Rule) => Rule.required() }),
    defineField({ name: "review", title: "ขั้นตรวจเนื้อหา", type: "reviewMetadata", validation: (Rule) => Rule.required() }),
  ],
});

export const socialSchemaTypes = [masterContent, socialVariant];
