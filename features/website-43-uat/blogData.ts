import { WEBSITE43_BASE as BASE } from './constants';

export type Website43ArticleItem = {
  category: string;
  title: string;
  excerpt: string;
  meta: string;
  publishedAt: string;
  image: string;
  href: string;
};

export const website43Articles: Website43ArticleItem[] = [
  {
    category: 'ประกันสุขภาพ',
    title: 'รู้จัก AIA Vitality สุขภาพดี มีเงินคืนและส่วนลดสุดคุ้ม',
    excerpt: 'ทำความเข้าใจสิทธิประโยชน์และเงื่อนไขก่อนตัดสินใจเลือกแผน',
    meta: 'อ่าน 7 นาที · เผยแพร่ 4 ส.ค. 2569',
    publishedAt: '2026-08-04T14:39:00+07:00',
    image: '/assets/blog-migration/aia-vitality/featured-01-financial-basewealth-by-ccpun-template-vitality-1.webp',
    href: `${BASE}/blog/health-insurance/aia-vitality`,
  },
  {
    category: 'ประกันสุขภาพ',
    title: 'AIA Health CI Hero คืออะไร? เหมาะกับใคร',
    excerpt: 'สรุปจุดเด่น ขอบเขตความคุ้มครอง และคำถามที่ควรถามก่อนซื้อ',
    meta: 'อ่าน 8 นาที · เผยแพร่ 3 ส.ค. 2569',
    publishedAt: '2026-08-03T22:29:00+07:00',
    image: '/assets/blog-migration/aia-health-ci-hero-guide/featured-01-Financial-Basewealth-by-CCPun-Template.webp',
    href: `${BASE}/blog/health-insurance/aia-health-ci-hero-guide`,
  },
  {
    category: 'ประกันโรคร้ายแรง',
    title: 'ประกันโรคร้ายแรงคืออะไร? ต่างจากประกันสุขภาพอย่างไร',
    excerpt: 'แยกบทบาทเงินก้อนและค่ารักษา เพื่อไม่ให้วางความคุ้มครองซ้ำหรือขาด',
    meta: 'อ่าน 9 นาที · เผยแพร่ 22 พ.ค. 2569',
    publishedAt: '2026-05-22T12:27:00+07:00',
    image: '/assets/blog-migration/critical-illness-insurance/featured-01-Financial-Basewealth-by-CCPun-Template.png',
    href: `${BASE}/blog/critical-illness-insurance/critical-illness-insurance`,
  },
  {
    category: 'ประกันสุขภาพ',
    title: 'AIA Health Happy คืออะไร? แต่ละแผนเหมาะกับใคร อัปเดต 2026',
    excerpt: 'เทียบโครงสร้างแผนและข้อควรตรวจให้เข้าใจก่อนเลือกวงเงิน',
    meta: 'อ่าน 10 นาที · เผยแพร่ 6 เม.ย. 2569',
    publishedAt: '2026-04-06T22:12:00+07:00',
    image: '/assets/blog-migration/aia-health-happy-describe/featured-01-AIA-Health-Happy-article.png',
    href: `${BASE}/blog/health-insurance/aia-health-happy-describe`,
  },
  {
    category: 'การเงินส่วนบุคคล',
    title: 'พีระมิดทางการเงิน คืออะไร? วางรากฐานก่อนลงทุน',
    excerpt: 'เรียงลำดับเงินสำรอง ความคุ้มครอง และการลงทุนให้สัมพันธ์กับชีวิตจริง',
    meta: 'อ่าน 6 นาที · เผยแพร่ 2 มี.ค. 2569',
    publishedAt: '2026-03-02T15:55:00+07:00',
    image: '/assets/blog-migration/financial-pyramid/featured-01-Financial-Pyramid-Article.png',
    href: `${BASE}/blog/personal-finance/financial-pyramid`,
  },
];

export const website43ArticlesByPublished = [...website43Articles].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);
