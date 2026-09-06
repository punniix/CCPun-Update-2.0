export const WEBSITE43_BASE = '/preview/website-4-3';

export const WEBSITE43_BLOG_CATEGORIES = [
  { slug: null, title: 'ทุกหมวดหมู่', path: '/blog' },
  { slug: 'life-insurance', title: 'ประกันชีวิต', path: '/blog/life-insurance' },
  { slug: 'health-insurance', title: 'ประกันสุขภาพ', path: '/blog/health-insurance' },
  { slug: 'critical-illness', title: 'ประกันโรคร้ายแรง', path: '/blog/critical-illness' },
  { slug: 'personal-finance', title: 'การเงินส่วนบุคคล', path: '/blog/personal-finance' },
] as const;

export type Website43BlogCategorySlug = Exclude<(typeof WEBSITE43_BLOG_CATEGORIES)[number]['slug'], null>;
