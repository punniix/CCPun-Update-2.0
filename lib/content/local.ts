import type { Article, ContentProvider } from "./types";

const LOCAL_ARTICLES: Article[] = [
  {
    id: "uat-article-system-v1",
    slug: "uat-article-system",
    title: "ตัวอย่างบทความ UAT — ระบบบทความ CCPun 4.0",
    excerpt:
      "บทความตัวอย่างสำหรับตรวจ UX/UI, Draft Mode, SEO metadata และโครงสร้างเนื้อหาก่อนเชื่อม Sanity จริง",
    category: "UAT",
    authorName: "CCPun",
    status: "draft",
    updatedAt: "2026-08-18T11:29:00+07:00",
    seoTitle: "ตัวอย่างบทความ UAT | CCPun 4.0",
    seoDescription:
      "หน้าทดสอบระบบบทความ CCPun 4.0 สำหรับตรวจรูปแบบการอ่าน Draft Preview และองค์ประกอบ SEO ก่อนเชื่อม CMS จริง",
    review: { status: "ready-for-coo", contentReviewedAt: "2026-08-18T12:00:00+07:00", factCheckedAt: "2026-08-18T12:00:00+07:00" },
    geo: {
      summary: "ตัวอย่าง Draft สำหรับตรวจระบบบทความและ Preview ของ CCPun Website 4.0",
      keyEntities: ["CCPun", "Website 4.0", "Sanity", "Vercel"],
      keyQuestions: ["Draft article preview ทำงานอย่างไร", "Draft เข้า sitemap หรือไม่"],
    },
    faq: [
      { question: "Draft article จะเข้า sitemap ไหม?", answer: "ไม่เข้า ระบบจะส่งเฉพาะบทความที่มีสถานะ published ไปยัง blog sitemap" },
      { question: "Preview ใช้หน้าตาเดียวกับเว็บไซต์จริงไหม?", answer: "ใช่ Draft Preview ใช้ Article UI ของ Website 4.0 แต่ถูกตั้ง noindex,nofollow และไม่เปิดให้ผู้ใช้ทั่วไปเห็น" },
    ],
    body: [
      {
        type: "paragraph",
        text: "หน้านี้เป็น Draft สำหรับ Local UAT เท่านั้น จุดประสงค์คือใช้ตรวจว่าหน้าบทความใหม่ยังอยู่ในภาษาภาพเดียวกับ Website 4.0 ทั้งบนมือถือ แท็บเล็ต และเดสก์ท็อป",
      },
      {
        type: "heading",
        level: 2,
        text: "สิ่งที่ต้องรักษาจาก Website 4.0",
      },
      {
        type: "bulletList",
        items: [
          "ใช้ Kanit และลำดับตัวอักษรเดียวกับเว็บไซต์หลัก",
          "ใช้พื้นหลัง warm charcoal และ gold accent อย่างจำกัด",
          "ใช้ Navbar, Footer, CTA และ focus state ชุดเดียวกับเว็บหลัก",
          "ให้หน้าบทความเน้นการอ่าน ไม่ใช้ hero ใหญ่แบบหน้าแคมเปญ",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Draft และ Preview ทำงานแยกจากหน้า Public",
      },
      {
        type: "paragraph",
        text: "เมื่อ Draft Mode เปิด ระบบ Local UAT จะแสดงบทความที่ยังไม่เผยแพร่และใส่ noindex อัตโนมัติ ส่วนโหมดปกติจะไม่เปิด Draft ให้ผู้ใช้ทั่วไปเห็น หลักการเดียวกันนี้จะถูกนำไปใช้กับ Sanity หลังจากเชื่อม project จริง",
      },
      {
        type: "callout",
        title: "UAT Only",
        text: "เนื้อหาในหน้านี้ไม่ใช่บทความสำหรับเผยแพร่ และจะไม่ถูกใส่ใน sitemap จนกว่าสถานะจะเป็น published",
      },
      {
        type: "heading",
        level: 2,
        text: "โครงสร้างที่เตรียมไว้สำหรับ CMS",
      },
      {
        type: "numberList",
        items: [
          "Draft content",
          "Preview บนหน้าตา Website 4.0",
          "ตรวจ SEO/GEO metadata และ structured data",
          "Approve ก่อนเปลี่ยนสถานะเป็น Published",
          "Published content เท่านั้นจึงเข้า sitemap",
        ],
      },
    ],
  },
];

export const localContentProvider: ContentProvider = {
  async listArticles(options = {}) {
    const includeDrafts = options.includeDrafts === true;
    return LOCAL_ARTICLES.filter((article) => includeDrafts || article.status === "published");
  },
  async getArticleBySlug(slug, options = {}) {
    const article = LOCAL_ARTICLES.find((item) => item.slug === slug) ?? null;
    if (!article) return null;
    if (article.status === "draft" && options.includeDrafts !== true) return null;
    return article;
  },
};
