import { motion } from "framer-motion";
import { ShieldCheck, Search, Calendar, Star, Clock, CreditCard } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Profiles",
    description: "Every professional undergoes verification, background checks, and skill assessment before joining our platform.",
  },
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Find perfect opportunities based on skills, experience, location, and availability with our intelligent search.",
  },
  {
    icon: Calendar,
    title: "Flexible Opportunities",
    description: "Choose from full-time, part-time, or project-based work. Schedule as per your convenience.",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description: "Build your reputation with genuine reviews and ratings from verified employers and clients.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Get instant notifications about job opportunities, applications, and interview schedules.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Receive payments securely through the platform. No payment delays, complete transaction history.",
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

export const FeaturesSection = () => {
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
            Why RoozgaarSetu?
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
            Trust Built Into Every Feature
          </h2>
          <p className="text-lg text-muted-foreground">
            We've designed every aspect of our platform to ensure safety, reliability, and convenience for both professionals and businesses.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group rounded-2xl border border-border bg-card p-6 shadow-brand transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                <feature.icon className="h-7 w-7 text-primary transition-colors group-hover:text-primary-foreground" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-semibold">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
