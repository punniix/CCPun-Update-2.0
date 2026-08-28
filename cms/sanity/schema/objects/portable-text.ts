import { defineArrayMember, defineField, defineType } from "sanity";

export const portableText = defineType({
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
