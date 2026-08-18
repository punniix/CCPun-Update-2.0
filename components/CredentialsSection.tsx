import Image from "next/image";

const originalImage = "/assets/cmsk-cfp-paper1-original.webp";

const CredentialsSection = () => {
  return (
    <section
      id="credentials"
      aria-label="กิจกรรมที่เข้าร่วม"
      className="relative overflow-hidden py-16 md:py-24"
      data-uat-section="credentials"
    >
      <div className="absolute inset-0 section-bg-dark" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-9 lg:grid-cols-[minmax(0,.78fr)_minmax(340px,1.22fr)] lg:gap-14">
          <div className="pb-2">
            <p className="mb-3 text-sm font-medium text-primary/80">พัฒนาความรู้เพื่อการวางแผน</p>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] text-foreground sm:text-3xl md:text-4xl">
              กิจกรรมที่เข้าร่วม
            </h2>
            <h3 className="mt-7 text-xl font-semibold leading-8 text-foreground md:text-2xl">
              อบรมหลักสูตรการวางแผนการเงิน CFP (ชุดวิชาที่ 1)
            </h3>
            <p className="mt-3 max-w-[46ch] text-base leading-7 text-foreground/64">
              พื้นฐานการวางแผนการเงิน ภาษี และจรรยาบรรณกับสถาบัน CMSK
            </p>
          </div>

          <figure className="overflow-hidden border-y border-primary/18 py-5">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src={originalImage}
                alt="สอบผ่านหลักสูตรการวางแผนการเงิน CFP Paper 1 จากสถาบัน CMSK"
                className="h-auto w-full object-cover"
                width={800}
                height={500}
                sizes="(min-width: 1024px) 620px, calc(100vw - 32px)"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default CredentialsSection;
