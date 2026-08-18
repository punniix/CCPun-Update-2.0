import Link from "next/link";
import { Activity, HeartPulse } from "lucide-react";
import navConfig from "@/lib/nav-config.json";

const ICONS = [Activity, HeartPulse];

const ToolsSection = () => (
    <section className="relative overflow-hidden border-t border-primary/15 py-16 md:py-20" aria-label="เครื่องมือวางแผนการเงิน">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          เครื่องมือช่วยวางแผนการเงิน
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          ลองประเมินภาพรวมก่อนคุยรายละเอียด เพื่อให้คำปรึกษาตรงจุดขึ้น
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        {navConfig.tools.map((tool, index) => {
          const Icon = ICONS[index] ?? Activity;
          return (
            <div key={tool.href}>
              <Link
                href={tool.href}
                prefetch={false}
                className="form-glass p-5 md:p-6 flex items-center justify-between gap-4 hover:border-primary/35 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground leading-snug">{tool.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {index === 0 ? "ดูสุขภาพการเงินและช่องว่างความคุ้มครอง" : "ประเมินเงินก้อนรับมือโรคร้ายแรง"}
                    </p>
                  </div>
                </div>
                <span className="text-primary text-sm font-semibold shrink-0">เปิด</span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default ToolsSection;
