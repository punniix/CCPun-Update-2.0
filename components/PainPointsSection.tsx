import Image from "next/image";

const painPoints = [
  {
    title: "เงินเดือนหมดก่อนสิ้นเดือน",
    description: "เงินเดือนออกเพียงไม่กี่วัน ก็ใช้ไปจนหมด ไม่เหลือออม",
    src: "/assets/home-stories/pain-cashflow-v1.webp",
    alt: "CCPun ช่วยลูกค้าทบทวนรายรับรายจ่ายและเงินคงเหลือในแต่ละเดือน",
  },
  {
    title: "ไม่มีประกัน หรือมีแต่ไม่พอ",
    description: "ไม่มีประกันติดตัว หรือมีแต่ไม่แน่ใจว่าเพียงพอต่อการรับมือกับเหตุไม่คาดฝันหรือไม่",
    src: "/assets/home-stories/pain-protection-v1.webp",
    alt: "CCPun ช่วยคู่รักทบทวนความคุ้มครองชีวิตและสุขภาพของครอบครัว",
  },
  {
    title: "เสียภาษีมากเกินไป",
    description: "หาเงินได้มาก และเสียภาษีมาก เพราะไม่รู้สิทธิลดหย่อนที่สามารถทำได้แบบถูกกฎหมาย",
    src: "/assets/home-stories/pain-tax-v1.webp",
    alt: "CCPun ช่วยลูกค้าทบทวนเอกสารและแนวทางวางแผนภาษี",
  },
  {
    title: "กังวลเรื่องเกษียณ",
    description: "กลัวเงินเก็บที่มีไม่พอใช้ในวันที่ต้องเกษียณ",
    src: "/assets/home-stories/pain-retirement-v1.webp",
    alt: "CCPun ช่วยคู่รักวัยทำงานทบทวนความพร้อมด้านเงินเกษียณ",
  },
  {
    title: "ขาดทุนจากการลงทุน",
    description: "ลงทุนตามกระแส ไม่มีแผนการลงทุนที่ชัดเจน",
    src: "/assets/home-stories/pain-investment-v1.webp",
    alt: "CCPun ช่วยลูกค้าทบทวนแผนการลงทุนผ่านคอมพิวเตอร์ที่ไม่มีข้อมูลส่วนบุคคล",
  },
];

const PainPointsSection = () => {
  return (
    <section
      id="pain-points"
      aria-label="ปัญหาการเงินที่พบบ่อย"
      className="relative overflow-hidden py-14 md:py-20"
      data-uat-section="pain-points"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/15 to-background" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl md:mb-10">
          <p className="mb-3 text-sm font-medium text-primary/80">เริ่มจากสิ่งที่กำลังกังวล</p>
          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
            คุณกำลังเจอปัญหาเหล่านี้อยู่ไหม?
          </h2>
        </div>

        <ol className="space-y-12 md:space-y-16">
          {painPoints.map((point, index) => (
            <li
              key={point.title}
              className="grid items-center gap-6 md:grid-cols-2 md:gap-10 lg:gap-16"
            >
              <div
                className={`relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-secondary/20 ${index % 2 ? "md:order-2" : ""}`}
                data-uat-role="pain-story-image"
              >
                <Image
                  src={point.src}
                  alt={point.alt}
                  fill
                  quality={90}
                  sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1199px) 46vw, 560px"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, hsl(var(--background)) 0%, transparent 8%, transparent 92%, hsl(var(--background)) 100%), linear-gradient(180deg, transparent 68%, hsl(var(--background)) 100%)",
                  }}
                />
              </div>
              <div className={`border-l border-primary/38 pl-5 ${index % 2 ? "md:order-1" : ""}`}>
                <span className="text-xs font-semibold tracking-[0.16em] text-primary/75">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground md:text-2xl">{point.title}</h3>
                <p className="mt-3 max-w-[42ch] text-base leading-7 text-foreground/68">{point.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs leading-6 text-foreground/45">ภาพประกอบสร้างด้วย Generative AI โดยใช้ภาพ CCPun เป็นบุคคลอ้างอิง</p>
      </div>
    </section>
  );
};

export default PainPointsSection;
