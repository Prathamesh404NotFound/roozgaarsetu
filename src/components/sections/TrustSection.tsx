import { motion } from "framer-motion";
import { ShieldCheck, Award, FileCheck, Clock } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Police Verification",
    description: "Every worker's identity is verified through official police records",
  },
  {
    icon: FileCheck,
    title: "Document Verification",
    description: "Aadhaar, address proof, and references are thoroughly checked",
  },
  {
    icon: Award,
    title: "Skill Assessment",
    description: "Workers are tested and rated on their specific service skills",
  },
  {
    icon: Clock,
    title: "Continuous Monitoring",
    description: "Regular performance reviews and feedback integration",
  },
];

export const TrustSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-gold blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-gold">
            Trust & Safety
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold text-white md:text-4xl">
            Your Safety Is Our Priority
          </h2>
          <p className="text-lg text-white/80">
            We've built a comprehensive verification system to ensure every worker on our platform is trustworthy and reliable.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <item.icon className="h-8 w-8 text-success" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-sm text-white/70">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-16"
        >
          <div className="text-center">
            <div className="font-heading text-4xl font-bold text-white">100%</div>
            <div className="text-sm text-white/70">Verified Workers</div>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <div className="font-heading text-4xl font-bold text-white">4.8★</div>
            <div className="text-sm text-white/70">Average Rating</div>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <div className="font-heading text-4xl font-bold text-white">10,000+</div>
            <div className="text-sm text-white/70">Happy Households</div>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <div className="font-heading text-4xl font-bold text-white">24/7</div>
            <div className="text-sm text-white/70">Support Available</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
