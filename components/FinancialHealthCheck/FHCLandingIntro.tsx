import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, MessageCircle } from 'lucide-react';

const truths = [
  [
    '01',
    'ความคุ้มครองต้องเทียบกับภาระจริง',
    'ช่องว่างความคุ้มครองและความต้องการทุนประกันชีวิตควรดูจากค่าใช้จ่าย หนี้ และเป้าหมายของคนที่ยังต้องพึ่งรายได้',
  ],
  [
    '02',
    'สภาพคล่องต้องรับมือเหตุไม่คาดคิด',
    'เงินสำรองฉุกเฉิน ภาระหนี้ และความเสี่ยงโรคร้ายแรงควรถูกทบทวนร่วมกัน เพราะทุกเรื่องกระทบเงินที่พร้อมใช้',
  ],
  [
    '03',
    'ลงทุนเมื่อฐานการเงินพร้อม',
    'ความพร้อมลงทุนและแผนเกษียณควรต่อยอดจากฐานที่รับความเสี่ยงระยะสั้นและความคุ้มครองจำเป็นได้แล้ว',
  ],
] as const;

export const FHC_FAQS = [
  {
    question: 'Financial Health Check หน้านี้ประเมินอะไร?',
    answer: 'หน้านี้เริ่มจากโมดูลประเมินความต้องการทุนประกันชีวิต โดยเทียบภาระครอบครัว หนี้ และทุนการศึกษาบุตร กับทุนประกันชีวิตและสินทรัพย์ที่คุณตั้งใจใช้ ยังไม่ได้ให้คะแนนสุขภาพการเงินทุกด้าน',
  },
  {
    question: 'ผลลัพธ์หมายความว่าสุขภาพการเงินดีหรือไม่?',
    answer: 'ยังสรุปไม่ได้ ผลลัพธ์แสดงเฉพาะช่องว่างความคุ้มครองชีวิตตามข้อมูลและสมมติฐานที่กรอก ควรทบทวนเงินสำรองฉุกเฉิน หนี้ ความเสี่ยงโรคร้ายแรง ความพร้อมลงทุน และเกษียณร่วมด้วย',
  },
  {
    question: 'ผลลัพธ์ใช้เป็นคำแนะนำเฉพาะบุคคลได้หรือไม่?',
    answer: 'ไม่ได้ ผลลัพธ์เป็นประมาณการเบื้องต้น ไม่ใช่คำแนะนำให้ซื้อผลิตภัณฑ์หรือวงเงินเฉพาะ ควรตรวจรายละเอียดความคุ้มครอง เงื่อนไข และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจ',
  },
] as const;

export default function FHCLandingIntro() {
  return (
    <section aria-labelledby="fhc-intro-title" className="px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <div aria-hidden="true" className="mb-5 h-px w-16 bg-primary/70" />
            <h2
              id="fhc-intro-title"
              className="text-3xl font-bold leading-tight text-foreground md:text-4xl"
            >
              การตรวจสุขภาพการเงินต้องดูหลายเรื่องให้เชื่อมกัน
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              <p>
                สุขภาพการเงินไม่ได้วัดจากเงินออมหรือผลตอบแทนเพียงอย่างเดียว แต่ต้องดูว่ารายรับ รายจ่าย หนี้ เงินสำรอง ความคุ้มครอง และเป้าหมายระยะยาวรองรับกันหรือไม่
              </p>
              <p>
                หน้า Financial Health Check นี้เริ่มจากโมดูลความคุ้มครองชีวิต เพื่อช่วยให้เห็นภาระที่ครอบครัวยังต้องดูแลและส่วนต่างของเงินก้อน ก่อนนำไปทบทวนด้านอื่นของแผนการเงิน
              </p>
            </div>
          </div>

          <figure>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/35 bg-card/30">
              <Image
                src="/assets/home-stories/planning-protection-v1.webp"
                alt="CCPun กำลังทบทวนแผนการเงินกับครอบครัวที่มีบุตร"
                fill
                quality={90}
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-transparent" />
            </div>
            <figcaption className="mt-3 text-xs leading-6 text-foreground/45">
              ภาพประกอบสร้างด้วย Generative AI โดยใช้ภาพ CCPun เป็นบุคคลอ้างอิง
            </figcaption>
          </figure>
        </div>

        <section aria-labelledby="fhc-truths-title" className="mt-14 border-y border-border/40 md:mt-20">
          <div className="py-6">
            <p className="text-sm font-semibold text-primary">
              กรอบ Financial Health Check
            </p>
            <h3 id="fhc-truths-title" className="mt-2 text-2xl font-bold text-foreground">
              7 เรื่องใน 3 กลุ่มที่ควรทบทวนให้เชื่อมกัน
            </h3>
          </div>
          <ol className="grid divide-y divide-border/40 md:grid-cols-3 md:divide-x md:divide-y-0">
            {truths.map(([number, title, description]) => (
              <li key={number} className="py-8 md:px-7 md:first:pl-0 md:last:pr-0">
                <p className="text-4xl font-bold tracking-tight text-primary/55">{number}</p>
                <h4 className="mt-5 text-xl font-semibold leading-snug text-foreground">{title}</h4>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="fhc-method-title"
          className="mt-14 grid gap-8 rounded-3xl border border-border/35 bg-card/25 p-6 md:mt-20 md:grid-cols-[0.8fr_1.2fr] md:p-10"
        >
          <div>
            <p className="text-sm font-semibold text-primary">โมดูลที่เปิดให้ใช้ตอนนี้</p>
            <h3 id="fhc-method-title" className="mt-3 text-2xl font-bold leading-snug text-foreground">
              ประเมินความต้องการทุนประกันชีวิต
            </h3>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              เริ่มจากค่าใช้จ่ายในครอบครัวและระยะเวลาที่ต้องการให้เงินก้อนรองรับ แล้วเพิ่มหนี้และทุนการศึกษาบุตร ก่อนเทียบกับทุนประกันชีวิตและสินทรัพย์ที่ตั้งใจใช้
            </p>
            <p>
              ระบบจะแสดงช่องว่างความคุ้มครองจากข้อมูลที่กรอก เพื่อใช้ตั้งคำถามกับแผนเบื้องต้น ไม่ใช่คะแนนสุขภาพการเงินทั้งแผน และไม่ใช่คำแนะนำให้ซื้อผลิตภัณฑ์หรือวงเงินเฉพาะ
            </p>
            <p>
              ดูฐานของแผนการเงินต่อได้ที่{' '}
              <Link href="/blog/personal-finance/financial-pyramid/" className="text-primary underline underline-offset-4">พีระมิดทางการเงิน</Link>
              {' '}และหากต้องการทบทวนเงินก้อนเมื่อเผชิญโรคร้ายแรง ใช้{' '}
              <Link href="/ci-planning/" className="text-primary underline underline-offset-4">เครื่องมือวางแผนทุนโรคร้ายแรง</Link>
            </p>
          </div>
        </section>

        <section aria-labelledby="fhc-faq-title" className="mt-14 md:mt-20">
          <p className="text-sm font-semibold text-primary">คำถามที่พบบ่อย</p>
          <h3 id="fhc-faq-title" className="mt-2 text-2xl font-bold text-foreground">
            เรื่องที่ควรรู้ก่อนใช้ผลประเมิน
          </h3>
          <div className="mt-6 divide-y divide-border/30 border-y border-border/30">
            {FHC_FAQS.map((faq) => (
              <details key={faq.question} className="group py-1">
                <summary className="min-h-11 cursor-pointer py-3 text-base font-semibold leading-relaxed text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {faq.question}
                </summary>
                <p className="pb-5 pr-2 text-base leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/30 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            เริ่มจากข้อมูลที่ทราบก่อน แล้วค่อยกลับมาแก้ไขเมื่อพร้อม
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#fhc-calculator"
              className="gold-button liquid-shine inline-flex min-h-14 items-center justify-center gap-2 px-7 py-3"
            >
              เริ่มประเมินความต้องการทุนประกันชีวิต
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="https://lin.ee/tqLCs4f"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="คุยกับ CCPun ทาง LINE OA (เปิดในแท็บใหม่)"
              className="glass-button inline-flex min-h-14 items-center justify-center gap-2 px-7 py-3"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              คุยกับ CCPun ทาง LINE OA
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          ผลลัพธ์เป็นประมาณการเบื้องต้นจากข้อมูลและสมมติฐานที่คุณกรอก ไม่ใช่คำแนะนำเฉพาะบุคคล
          และไม่ยืนยันว่าจำนวนเงินจะเพียงพอในทุกกรณี โปรดศึกษารายละเอียดความคุ้มครอง เงื่อนไข
          และข้อยกเว้นของกรมธรรม์ก่อนตัดสินใจทำประกันภัย และประกันไม่ใช่เงินฝาก
        </p>
      </div>
    </section>
  );
}
