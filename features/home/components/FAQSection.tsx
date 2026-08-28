import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "CCPun คือใคร?",
    answer:
      "CCPun คือที่ปรึกษาการเงินอิสระ มีใบอนุญาตผู้แนะนำการลงทุนจาก ก.ล.ต. และใบอนุญาตตัวแทนประกันชีวิตจาก คปภ. เน้นการวางแผนการเงิน ประกันชีวิต ประกันสุขภาพ การลงทุน และภาษีให้เหมาะกับแต่ละคน",
  },
  {
    question: "CCPun ช่วยวางแผนเรื่องอะไรได้บ้าง?",
    answer:
      "ช่วยตรวจสุขภาพการเงิน วางแผนคุ้มครองชีวิตและสุขภาพ วางแผนประกันโรคร้ายแรง วางแผนลงทุนผ่านกองทุนรวม และจัดโครงสร้างลดหย่อนภาษีอย่างถูกกฎหมาย โดยดูจากเป้าหมาย รายได้ ภาระ และความเสี่ยงจริงของคุณ",
  },
  {
    question: "ประกันชีวิตหรือประกันสุขภาพเป็นเงินฝากไหม?",
    answer:
      "ไม่ใช่เงินฝาก ประกันชีวิตและประกันสุขภาพเป็นสัญญาประกันภัย มีเงื่อนไข ความคุ้มครอง ข้อยกเว้น และมูลค่าตามกรมธรรม์ ควรอ่านรายละเอียดกรมธรรม์และเปรียบเทียบกับเป้าหมายการเงินก่อนตัดสินใจ",
  },
];

const FAQSection = () => {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden py-16 md:py-24"
      data-uat-section="faq"
    >
      <div className="absolute inset-0 section-bg-dark" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 md:mb-12">
          <p className="mb-3 text-sm font-medium text-primary/80">คำถามที่พบบ่อย</p>
          <h2 id="faq-heading" className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
            ก่อนเริ่มวางแผนกับ <span className="text-primary">CCPun</span>
          </h2>
        </div>

        <div className="border-y border-white/[0.09]">
          {faqs.map((item, index) => (
            <details key={item.question} open={index === 0} className="group border-b border-white/[0.075] last:border-b-0">
              <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-5 rounded-sm py-5 text-base font-semibold text-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 md:min-h-[84px] md:text-lg [&::-webkit-details-marker]:hidden">
                <span role="heading" aria-level={3}>{item.question}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.09] text-primary/80 transition-colors group-hover:border-primary/25">
                  <ChevronDown
                    size={17}
                    className="transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <p className="max-w-[66ch] pb-6 pr-12 text-sm leading-7 text-foreground/62 md:text-base md:leading-8">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
