const truths = [
  ['01', 'ความคุ้มครองต้องเทียบกับภาระจริง', 'ช่องว่างความคุ้มครองและความต้องการทุนประกันชีวิตควรดูจากค่าใช้จ่าย หนี้ และเป้าหมายของคนที่ยังต้องพึ่งรายได้'],
  ['02', 'สภาพคล่องต้องรับมือเหตุไม่คาดคิด', 'เงินสำรองฉุกเฉิน ภาระหนี้ และความเสี่ยงโรคร้ายแรงควรถูกทบทวนร่วมกัน เพราะทุกเรื่องกระทบเงินที่พร้อมใช้'],
  ['03', 'ลงทุนเมื่อฐานการเงินพร้อม', 'ความพร้อมลงทุนและแผนเกษียณควรต่อยอดจากฐานที่รับความเสี่ยงระยะสั้นและความคุ้มครองจำเป็นได้แล้ว'],
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
    <section aria-labelledby="fhc-intro-title" className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <h2 id="fhc-intro-title" className="text-[28px] font-bold leading-tight text-foreground md:text-[32px]">
          7 เรื่องใน 3 กลุ่มที่ควรทบทวนให้เชื่อมกัน
        </h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {truths.map(([number, title, description]) => (
            <li key={number} className="rounded-2xl border border-border/40 bg-card/55 p-5">
              <p className="text-sm font-semibold text-primary">{number}</p>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>

        <section aria-labelledby="fhc-faq-title" className="mt-8 rounded-2xl border border-border/40 bg-card/35 p-5 md:p-7">
          <h2 id="fhc-faq-title" className="text-[28px] font-bold leading-tight text-foreground md:text-[32px]">
            คำถามที่พบบ่อย / ขอบเขตการประเมิน / อ่านต่อ
          </h2>
          <div className="mt-5 divide-y divide-border/30">
            {FHC_FAQS.map((faq) => (
              <details key={faq.question} className="group py-1">
                <summary className="flex min-h-11 cursor-pointer items-center py-3 text-base font-semibold leading-relaxed text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {faq.question}
                </summary>
                <p className="pb-5 text-base leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
