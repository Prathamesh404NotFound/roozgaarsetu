import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { FoundersSection } from "@/components/sections/FoundersSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { CTASection } from "@/components/sections/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FoundersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ServicesSection />
      <TrustSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
