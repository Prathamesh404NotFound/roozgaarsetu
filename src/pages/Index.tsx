import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { CTASection } from "@/components/sections/CTASection";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <Layout>
      <SEO
        title="Find Verified Cooks, Cleaners, Drivers & Caregivers in Kolhapur"
        description="Connect with trusted local cooks, cleaners, drivers, babysitters, and eldercare helpers in Kolhapur, Maharashtra. Multi-tier verified domestic workers."
        path="/"
      />
      <HeroSection />
      <ServicesSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
