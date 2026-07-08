import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { CTASection } from "@/components/sections/CTASection";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <Layout>
      <SEO
        title="RoozgaarSetu | Kolhapur's Verified Worker & Service Marketplace"
        description="RoozgaarSetu is Kolhapur's independent worker marketplace for verified cooks, cleaners, drivers, childcare & eldercare — not a government portal."
        path="/"
      />
      <HeroSection />
      <ServicesSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
