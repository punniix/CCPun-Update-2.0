'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToolHero from '@/components/ToolHero';
import FHCLandingIntro from './FHCLandingIntro';
import LifeCoverageWizard from './LifeCoverageWizard';

export default function ClientFHC() {
  return (
    <div className="public-ux42 min-h-screen bg-background flex flex-col">
      <Navbar isToolPage />

      <ToolHero
        badge="Financial Health Check · โมดูลความคุ้มครองชีวิต"
        title="ตรวจสุขภาพการเงิน"
        highlight="เริ่มจากช่องว่างความคุ้มครอง"
        highlightOnNewLine
        description="ประเมินภาระที่ครอบครัวยังต้องดูแล แล้วเทียบกับทุนประกันชีวิตและสินทรัพย์ที่พร้อมใช้ เพื่อเห็นจุดที่ควรทบทวนต่อในแผนการเงิน"
        calculatorHref="#fhc-calculator"
      />

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="pb-16">
        <div id="fhc-calculator" className="max-w-3xl mx-auto scroll-mt-24 px-4 pt-8">
          {/* Wizard */}
          <LifeCoverageWizard />
        </div>
        <FHCLandingIntro />
      </main>

      <Footer />
    </div>
  );
}
