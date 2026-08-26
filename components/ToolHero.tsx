type ToolHeroProps = {
  badge: string;
  title: string;
  highlight: string;
  highlightOnNewLine?: boolean;
  suffix?: string;
  description: string;
  calculatorHref: string;
};

export default function ToolHero({
  badge,
  title,
  highlight,
  highlightOnNewLine = false,
  suffix,
  description,
  calculatorHref,
}: ToolHeroProps) {
  return (
    <section className="tool-orientation-hero relative isolate w-full overflow-hidden border-b border-border/30 pb-12 pt-28 md:pb-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(ellipse at 50% -35%, hsl(45 60% 70% / 0.14), transparent 58%), linear-gradient(180deg, hsl(0 25% 14%) 0%, hsl(0 15% 18%) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent"
      />

      <div className="mx-auto max-w-3xl px-4 text-center">
        <span className="mb-4 inline-block text-sm font-semibold text-primary">
          {badge}
        </span>
        <h1 className={`mx-auto mb-4 text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.2] text-foreground [text-wrap:balance] ${highlightOnNewLine ? 'max-w-[32ch]' : 'max-w-[18ch]'}`}>
          <span className={highlightOnNewLine ? 'block md:whitespace-nowrap' : undefined}>{title}</span>
          <span className={highlightOnNewLine ? 'block md:whitespace-nowrap' : ''}>{highlight}</span>{' '}
          {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
        </h1>
        <div
          className="w-20 h-1 mx-auto rounded-full mb-4"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(45,60%,70%), transparent)' }}
        />
        <p className="mx-auto max-w-[58ch] text-base leading-relaxed text-foreground/80 md:text-[1.0625rem]">
          {description}
        </p>
        <ul className="mx-auto mt-6 grid max-w-lg gap-2 text-sm text-foreground/70 sm:grid-cols-3">
          <li className="rounded-full bg-secondary px-4 py-2">2 ขั้นตอน</li>
          <li className="rounded-full bg-secondary px-4 py-2">ไม่ต้องกรอกชื่อ/เบอร์/อีเมล</li>
          <li className="rounded-full bg-secondary px-4 py-2">เห็นผลหลังกรอกครบ</li>
        </ul>
        <a
          href={calculatorHref}
          className="gold-button liquid-shine mt-6 inline-flex min-h-14 min-w-44 items-center justify-center px-8 py-3 text-base"
        >
          เริ่มประเมิน
        </a>
        <a href={calculatorHref} className="mt-4 block min-h-11 text-sm font-medium leading-[44px] text-primary">
          ดูวิธีคิด ↓
        </a>
      </div>
    </section>
  );
}
