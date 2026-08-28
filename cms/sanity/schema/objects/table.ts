import { defineArrayMember, defineField, defineType } from "sanity";

export const tableRow = defineType({
  name: "tableRow",
  title: "Table row",
  type: "object",
  fields: [
    defineField({ name: "cells", title: "Cells", type: "array", of: [defineArrayMember({ type: "string" })] }),
  ],
});

export const simpleTable = defineType({
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
