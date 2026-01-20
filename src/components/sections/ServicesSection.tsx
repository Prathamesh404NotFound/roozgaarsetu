import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, Sparkles, Baby, Heart, Shirt, Car, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    id: "cooking",
    icon: ChefHat,
    name: "Cooking",
    description: "Professional cooks for daily meals, special occasions, or dietary needs",
    priceRange: "₹100 - ₹300/hr",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "cleaning",
    icon: Sparkles,
    name: "House Cleaning",
    description: "Thorough cleaning services for homes of all sizes",
    priceRange: "₹80 - ₹200/hr",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "childcare",
    icon: Baby,
    name: "Childcare",
    description: "Experienced nannies and babysitters for your children",
    priceRange: "₹150 - ₹400/hr",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    id: "eldercare",
    icon: Heart,
    name: "Elder Care",
    description: "Compassionate care for elderly family members",
    priceRange: "₹150 - ₹350/hr",
    color: "bg-red-500/10 text-red-600",
  },
  {
    id: "laundry",
    icon: Shirt,
    name: "Laundry & Ironing",
    description: "Professional laundry and ironing services",
    priceRange: "₹60 - ₹150/hr",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "driving",
    icon: Car,
    name: "Driver Services",
    description: "Reliable drivers for daily commute or special trips",
    priceRange: "₹200 - ₹500/hr",
    color: "bg-green-500/10 text-green-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const ServicesSection = () => {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Our Services
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
            Comprehensive Home Support
          </h2>
          <p className="text-lg text-muted-foreground">
            From daily cooking to specialized childcare, find verified professionals for all your household needs.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className="group"
            >
              <Link
                to={`/workers?service=${service.id}`}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${service.color}`}
                >
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-heading text-xl font-semibold">
                  {service.name}
                </h3>
                <p className="mb-4 flex-1 text-muted-foreground">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {service.priceRange}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Find Help <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Button asChild size="lg">
            <Link to="/services">
              View All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
