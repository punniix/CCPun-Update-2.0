import type { Metadata } from 'next';
import ClientFHC from '@/features/financial-health-check/components/ClientFHC';
import { FHC_FAQS } from '@/features/financial-health-check/components/FHCLandingIntro';
import { IS_REVIEW_ENVIRONMENT } from '@/lib/deployment-environment';

const FHC_DESCRIPTION = 'ตรวจสุขภาพการเงินผ่านโมดูลประเมินทุนประกันชีวิต ซึ่งครอบคลุมเฉพาะความคุ้มครองชีวิต เปรียบเทียบภาระครอบครัว หนี้ การศึกษาบุตร ความคุ้มครอง และสินทรัพย์ที่พร้อมใช้ เพื่อเริ่มทบทวนแผนการเงิน';

export const metadata: Metadata = {
  title: 'ตรวจสุขภาพการเงิน เริ่มจากช่องว่างความคุ้มครอง | CCPun',
  description: FHC_DESCRIPTION,
  keywords: [
    'ตรวจสุขภาพการเงิน',
    'financial health check',
    'วิเคราะห์ประกันชีวิต',
    'ความคุ้มครองที่ควรมี',
    'ที่ปรึกษาการเงิน',
    'CCPun',
    'ทุนประกันชีวิต',
    'คำนวณประกัน',
    'วางแผนการเงิน',
    'ความคุ้มครองที่ขาด',
  ],
  openGraph: {
    title: 'ตรวจสุขภาพการเงิน เริ่มจากช่องว่างความคุ้มครอง | CCPun',
    description: FHC_DESCRIPTION,
    url: 'https://ccpun.com/tools/financial-health-check/',
    siteName: 'CCPun Financial Advisor',
    images: [
      {
        url: 'https://ccpun.com/og-image-20260610.webp?v=68ae8d8',
        width: 1200,
        height: 630,
        alt: 'CCPun Financial Health Check',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ตรวจสุขภาพการเงิน เริ่มจากช่องว่างความคุ้มครอง | CCPun',
    description: FHC_DESCRIPTION,
    images: ['https://ccpun.com/og-image-20260610.webp?v=68ae8d8'],
  },
  robots: IS_REVIEW_ENVIRONMENT ? { index: false, follow: false } : { index: true, follow: true },
  alternates: {
    canonical: 'https://ccpun.com/tools/financial-health-check/',
    languages: { "th-TH": "https://ccpun.com/tools/financial-health-check/", "x-default": "https://ccpun.com/tools/financial-health-check/" },
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "หน้าหลัก", "item": "https://ccpun.com/" },
    { "@type": "ListItem", "position": 2, "name": "ตรวจสุขภาพการเงิน", "item": "https://ccpun.com/tools/financial-health-check/" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Financial Health Check: โมดูลประเมินทุนประกันชีวิต · Research Preview",
  "url": "https://ccpun.com/tools/financial-health-check/",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "author": {
    "@type": "Organization",
    "name": "CCPun Financial Advisor",
    "url": "https://ccpun.com"
  },
  "description": "เครื่องมือประเมินช่องว่างความคุ้มครองชีวิตจากภาระครอบครัวและทรัพยากรที่ผู้ใช้ตั้งใจใช้ เป็นจุดเริ่มต้นสำหรับทบทวนแผนการเงิน"
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FHC_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

export default function FinancialHealthCheckPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ClientFHC />
    </>
  );
}
