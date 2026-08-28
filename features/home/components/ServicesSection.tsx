import { Landmark, ReceiptText, ShieldCheck, TrendingUp } from "lucide-react";

const services = [
  {
    step: "01",
    title: "เช็กภาพรวมการเงิน",
    description: "รายได้ รายจ่าย หนี้ เงินสำรอง และเป้าหมาย",
    icon: Landmark,
  },
  {
    step: "02",
    title: "ปิดความเสี่ยง",
    description: "ชีวิต สุขภาพ และรายได้ที่อาจสะดุด",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "สร้างความมั่งคั่ง",
    description: "ลงทุนตามเป้าหมาย ระยะเวลา และความเสี่ยงที่รับได้",
    icon: TrendingUp,
  },
  {
    step: "04",
    title: "วางแผนภาษี",
    description: "ใช้สิทธิลดหย่อนให้สอดคล้องกับกระแสเงินสด",
    icon: ReceiptText,
  },
];

const ServicesSection = () => {
  return (
    <section
      id="services"
      aria-label="แนวทางการวางแผนกับ CCPun"
      className="relative overflow-hidden py-14 md:py-18"
      data-uat-section="planning"
    >
      <div className="absolute inset-0 section-bg-dark" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl md:mb-10">
          <p className="mb-3 text-sm font-medium text-primary/80">วางแผนแบบมีลำดับ</p>
          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
            วางแผนให้ครบ ในลำดับที่เหมาะกับคุณ
          </h2>
        </div>

        <ol className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <li key={service.title} className="mx-auto w-full max-w-[400px]">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/25 bg-primary/8 text-primary"
                  data-uat-role="planning-icon"
                >
                  <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className="mt-4 border-l border-primary/38 pl-4">
                  <span className="text-xs font-semibold tracking-[0.16em] text-primary/75">{service.step}</span>
                  <h3 className="mt-2 text-lg font-semibold text-foreground md:text-xl">{service.title}</h3>
                  <p className="mt-2 max-w-[32ch] text-sm leading-6 text-foreground/66 md:text-base md:leading-7">
                    {service.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default ServicesSection;
