'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToolHero from '@/components/ToolHero';
import FHCLandingIntro from './FHCLandingIntro';
import LifeCoverageWizard from './LifeCoverageWizard';

export default function ClientFHC() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isToolPage />

      <ToolHero
        badge="เครื่องคำนวณทุนประกันชีวิต · Research Preview"
        title="ทุนประกันชีวิต"
        highlight="ที่ครอบครัวต้องใช้"
        highlightOnNewLine
        description="เริ่มจากภาระและหนี้สินที่คนข้างหลังต้องดูแล แล้วเทียบกับทุนประกันชีวิตและสินทรัพย์ที่มี"
      />

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="pb-16">
        <FHCLandingIntro />
        <div id="fhc-calculator" className="max-w-3xl mx-auto scroll-mt-28 px-4 pt-6">
          {/* Wizard */}
          <LifeCoverageWizard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
