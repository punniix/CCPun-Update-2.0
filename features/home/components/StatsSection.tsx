const stats = [
  {
    value: "5+ ปี",
    label: "ประสบการณ์ทำงานด้านการเงิน",
    detail: "วางแผนโดยเน้นเป้าหมายที่ลูกค้าต้องการเป็นหลัก",
  },
  {
    value: "2 ใบ",
    label: "ใบอนุญาตสำหรับงานแนะนำ",
    detail: "ที่ได้รับการรับรองจาก คปภ. และ กลต.",
  },
  {
    value: "4 พาร์ทเนอร์",
    label: "หลากหลายเครื่องมือการเงินสำหรับวางแผนตามเป้าหมาย",
    detail: "มีช่องทางกับ AIA, Maybank, Phillip และ Finnomena เพื่อเพิ่มทางเลือกในการวางแผน",
  },
];

const StatsSection = () => {
  return (
    <section aria-label="ประสบการณ์และช่องทางการวางแผน" className="relative overflow-hidden py-12 md:py-16" data-uat-section="evidence">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.035] via-secondary/30 to-primary/[0.035]" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <dl className="relative grid border-y border-primary/20 md:grid-cols-3 md:divide-x md:divide-primary/15">
          {stats.map((stat) => (
            <div key={stat.label} className="border-b border-white/[0.07] py-7 last:border-b-0 md:border-b-0 md:px-8 md:py-9 first:md:pl-0 last:md:pr-0">
              <dt className="text-4xl font-semibold leading-none tracking-[-0.03em] text-primary md:text-5xl">{stat.value}</dt>
              <dd className="mt-5">
                <p className="text-base font-semibold leading-7 text-foreground md:text-lg">{stat.label}</p>
                <p className="mt-2 max-w-[38ch] text-sm leading-6 text-foreground/64 md:text-base md:leading-7">{stat.detail}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default StatsSection;
