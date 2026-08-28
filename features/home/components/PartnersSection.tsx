import Image from "next/image";

const partners = [
  { src: "/assets/aia-logo.webp", alt: "AIA ประเทศไทย", name: "AIA", role: "ประกันชีวิต" },
  { src: "/assets/maybank-logo.webp", alt: "Maybank Securities Thailand", name: "Maybank", role: "การลงทุน" },
  { src: "/assets/phillip-logo.svg", alt: "PhillipCapital Thailand", name: "PhillipCapital", role: "การลงทุน" },
  { src: "/assets/finnomena-logo.webp", alt: "Finnomena", name: "Finnomena", role: "การลงทุน" },
];

const PartnersSection = () => (
  <section aria-label="พาร์ทเนอร์สำหรับการวางแผน" className="relative overflow-hidden py-16 md:py-24" data-uat-section="partners">
    <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/22 to-background" aria-hidden="true" />

    <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mb-9 max-w-3xl md:mb-12">
        <p className="mb-3 text-sm font-medium text-primary/80">ทางเลือกสำหรับแต่ละเป้าหมาย</p>
        <h2 className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
          พาร์ทเนอร์สำหรับการวางแผน
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/64 md:text-lg">
          เพิ่มทางเลือกด้านประกันชีวิตและการลงทุนให้เหมาะกับเป้าหมายของแต่ละคน
        </p>
      </div>

      <div className="grid border-y border-primary/18 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-primary/15">
        {partners.map((p) => (
          <div
            key={p.name}
            className="flex min-h-[210px] flex-col items-center justify-center border-b border-white/[0.07] px-5 py-7 text-center sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:px-7"
          >
            <div className="flex h-24 w-32 items-center justify-center rounded-2xl bg-white p-4 md:h-28 md:w-36">
              <Image src={p.src} alt={p.alt} className="h-full w-full object-contain" width={144} height={112} sizes="144px" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm text-foreground/58">{p.role}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PartnersSection;
