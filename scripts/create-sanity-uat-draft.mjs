import { createClient } from "@sanity/client";

if (process.env.CCPUN_UAT_MODE !== "1") throw new Error("Refusing to write outside explicit UAT mode");

const projectId = process.env.SANITY_API_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_API_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !dataset || !token) throw new Error("Missing Sanity UAT configuration");

const documents = [
  {
    _id: "drafts.ccpun-uat-author",
    _type: "author",
    name: "CCPun",
    slug: { _type: "slug", current: "ccpun" },
    bio: "UAT author record for Website 4.0 CMS verification only.",
  },
  {
    _id: "drafts.ccpun-uat-category",
    _type: "category",
    title: "UAT",
    slug: { _type: "slug", current: "uat" },
    description: "UAT-only category. Do not publish.",
  },
  {
    _id: "drafts.ccpun-uat-article-system",
    _type: "article",
    title: "ตัวอย่างบทความ UAT — Sanity Draft CMS",
    slug: { _type: "slug", current: "uat-article-system" },
    excerpt: "Draft สำหรับตรวจ Sanity Studio, secure Draft Mode และการแยกเนื้อหา UAT ออกจาก public mode โดยไม่เผยแพร่",
    // ponytail: UAT support documents stay unpublished, so their references must remain weak.
    category: { _type: "reference", _ref: "ccpun-uat-category", _weak: true },
    tags: ["UAT", "Sanity", "Website 4.0"],
    author: { _type: "reference", _ref: "ccpun-uat-author", _weak: true },
    body: [
      {
        _key: "intro",
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: "intro-text", _type: "span", marks: [], text: "หน้านี้เป็น Draft สำหรับ UAT เท่านั้น และต้องมองเห็นได้เฉพาะเมื่อ secure Draft Mode เปิดอยู่" }],
      },
      {
        _key: "heading",
        _type: "block",
        style: "h2",
        markDefs: [],
        children: [{ _key: "heading-text", _type: "span", marks: [], text: "ขอบเขตการตรวจครั้งนี้" }],
      },
      ...["Draft ปรากฏใน Sanity Studio", "Normal request มองไม่เห็น Draft", "Draft ไม่เข้า sitemap และไม่สร้าง Article schema"].map((text, index) => ({
        _key: `bullet-${index}`,
        _type: "block",
        style: "normal",
        listItem: "bullet",
        level: 1,
        markDefs: [],
        children: [{ _key: `bullet-text-${index}`, _type: "span", marks: [], text }],
      })),
      {
        _key: "uat-callout",
        _type: "callout",
        title: "UAT Only",
        text: "ห้าม Publish เอกสารนี้ เนื้อหาใช้เพื่อทดสอบระบบ Preview เท่านั้น",
      },
    ],
    faq: [
      { _key: "faq-sitemap", _type: "faqItem", question: "Draft จะเข้า sitemap ไหม?", answer: "ไม่เข้า ระบบ query เฉพาะ published perspective สำหรับ sitemap" },
      { _key: "faq-schema", _type: "faqItem", question: "Draft สร้าง BlogPosting schema ไหม?", answer: "ไม่สร้าง Draft ถูกกำหนด noindex,nofollow และไม่มี article-specific structured data" },
    ],
    sources: [],
    review: { _type: "reviewMetadata", status: "drafting", notes: "UAT system draft — never publish" },
    seo: {
      _type: "seoMetadata",
      title: "Sanity Draft CMS UAT | CCPun Website 4.0",
      description: "Draft สำหรับตรวจระบบ Sanity Studio และ secure Draft Mode ของ CCPun Website 4.0 ในสภาพแวดล้อม UAT เท่านั้น",
      noindex: true,
    },
    geo: {
      _type: "geoMetadata",
      summary: "UAT-only draft for Sanity CMS and secure preview verification.",
      keyEntities: ["CCPun", "Sanity", "Vercel", "Website 4.0"],
      keyQuestions: ["Draft Mode แยกเนื้อหาที่ไม่เผยแพร่อย่างไร"],
    },
  },
];

if (documents.some((document) => !document._id.startsWith("drafts."))) {
  throw new Error("Refusing to create a non-draft document");
}

const client = createClient({ projectId, dataset, token, apiVersion: "2026-08-18", useCdn: false });
try {
  let references = client.transaction();
  for (const document of documents.slice(0, -1)) references = references.createOrReplace(document);
  await references.commit({ tag: "ccpun.uat.seed-draft.references" });
  await client.createOrReplace(documents.at(-1), { tag: "ccpun.uat.seed-draft.article" });
} catch (error) {
  const status = Number(error?.statusCode ?? error?.response?.statusCode);
  const bodyError = error?.response?.body?.error;
  const rawType = bodyError?.type;
  const type = typeof rawType === "string" && /^[a-z0-9._-]+$/i.test(rawType) ? rawType : "unknown";
  const diagnostics = Array.isArray(bodyError?.items)
    ? bodyError.items.map((item) => ({
        index: Number.isInteger(item?.index) ? item.index : null,
        type: typeof item?.error?.type === "string" ? item.error.type : null,
        id: typeof item?.error?.id === "string" ? item.error.id : null,
        referenceID: typeof item?.error?.referenceID === "string" ? item.error.referenceID : null,
      }))
    : [];
  console.error(
    `ERROR: Sanity UAT draft mutation failed; status=${Number.isFinite(status) ? status : "unknown"}; type=${type}; diagnostics=${JSON.stringify(diagnostics)}; request details redacted`,
  );
  process.exit(1);
}

console.log("PASS: created or refreshed 1 UAT article draft and 2 supporting drafts; nothing published");
