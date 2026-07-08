import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, Sparkles, Baby, Heart, Shirt, Car, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";

const services = [
  {
    id: "cooking",
    icon: ChefHat,
    name: "Cooking",
    description: "Professional cooks for daily meals, special occasions, or dietary needs. From Maharashtrian to North Indian cuisine.",
    priceRange: "₹100 - ₹300/hr",
    workerCount: 45,
    features: ["Daily Meal Prep", "Special Occasions", "Dietary Restrictions", "Multi-cuisine"],
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  {
    id: "cleaning",
    icon: Sparkles,
    name: "House Cleaning",
    description: "Thorough cleaning services for homes of all sizes. Regular maintenance or deep cleaning available.",
    priceRange: "₹80 - ₹200/hr",
    workerCount: 78,
    features: ["Daily Cleaning", "Deep Cleaning", "Move-in/Move-out", "Office Cleaning"],
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  {
    id: "childcare",
    icon: Baby,
    name: "Childcare",
    description: "Experienced nannies and babysitters for your children. From infants to school-going kids.",
    priceRange: "₹150 - ₹400/hr",
    workerCount: 32,
    features: ["Infant Care", "School Pickup", "Homework Help", "Activity Planning"],
    color: "bg-pink-500/10 text-pink-600 border-pink-200",
  },
  {
    id: "eldercare",
    icon: Heart,
    name: "Elder Care",
    description: "Compassionate care for elderly family members. Trained in basic medical assistance.",
    priceRange: "₹150 - ₹350/hr",
    workerCount: 28,
    features: ["Companionship", "Medication Reminders", "Mobility Assistance", "Personal Care"],
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
  {
    id: "laundry",
    icon: Shirt,
    name: "Laundry & Ironing",
    description: "Professional laundry and ironing services. Keep your wardrobe crisp and fresh.",
    priceRange: "₹60 - ₹150/hr",
    workerCount: 56,
    features: ["Daily Laundry", "Ironing", "Fabric Care", "Dry Cleaning Pickup"],
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  {
    id: "driving",
    icon: Car,
    name: "Driver Services",
    description: "Reliable drivers for daily commute or special trips. Licensed and experienced.",
    priceRange: "₹200 - ₹500/hr",
    workerCount: 24,
    features: ["Daily Commute", "School Runs", "Outstation Trips", "Event Transport"],
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Services = () => {
  return (
    <Layout>
      <SEO
        title="Domestic Help Services in Kolhapur - Cooking, Cleaning & Caregivers"
        description="Choose from our verified local services in Kolhapur including daily home cooks, deep house cleaning, licensed drivers, nannies, and eldercare caregivers."
        path="/services"
      />
      {/* Hero */}
      <section className="bg-gradient-hero py-16 lg:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="mb-4 font-heading text-3xl font-bold text-white md:text-5xl">
              Our Services
            </h1>
            <p className="text-lg text-white/80">
              From cooking to childcare, find verified professionals for all your household needs. Every worker is background-checked and skill-tested.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={itemVariants}
                className="group"
              >
                <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl border ${service.color}`}>
                    <service.icon className="h-8 w-8" />
                  </div>

                  <h3 className="mb-2 font-heading text-xl font-semibold">
                    {service.name}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6 flex flex-wrap gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <div className="text-lg font-semibold text-primary">
                        {service.priceRange}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {service.workerCount} workers available
                      </div>
                    </div>
                    <Link
                      to={`/workers?service=${service.id}`}
                      className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Find Help
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/5 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              Can't Find What You Need?
            </h2>
            <p className="mb-8 text-muted-foreground">
              We're constantly expanding our services. Contact us with your specific requirements and we'll help you find the right help.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Contact Us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
