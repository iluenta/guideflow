import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { Marquee } from "@/components/landing/Marquee";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Comparison } from "@/components/landing/Comparison";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BetaForm } from "@/components/landing/BetaForm";
import { FAQSection } from "@/components/landing/FAQSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen font-poppins selection:bg-landing-mint selection:text-landing-navy">
      <LandingNavbar />
      <HeroSection />
      <Marquee />
      <FeatureGrid />
      <Comparison />
      <HowItWorks />
      <BetaForm />
      <FAQSection />
      <LandingFooter />
    </main>
  );
}
