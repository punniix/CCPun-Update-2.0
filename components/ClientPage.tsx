import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import PainPointsSection from "./PainPointsSection";
import ServicesSection from "./ServicesSection";
import StatsSection from "./StatsSection";
import AboutSection from "./AboutSection";
import CredentialsSection from "./CredentialsSection";
import PartnersSection from "./PartnersSection";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";
import ContactSectionGate from "./ContactSectionGate";
import Footer from "./Footer";

export default function ClientPage() {
  return (
    <div className="public-ux42 min-h-screen bg-background">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <PainPointsSection />
        <ServicesSection />
        <StatsSection />
        <AboutSection />
        <CredentialsSection />
        <PartnersSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSectionGate />
      </main>
      <Footer />
    </div>
  );
}
