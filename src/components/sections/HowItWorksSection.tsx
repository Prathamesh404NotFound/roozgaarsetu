import { motion } from "framer-motion";
import { Search, UserCheck, CalendarCheck, ThumbsUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Search & Discover",
    description: "Browse verified workers by service type, location, and availability. Read reviews and compare options.",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Review Profiles",
    description: "View detailed profiles with verification badges, experience, skills, and genuine customer reviews.",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Book & Schedule",
    description: "Select your preferred time slots and book instantly. Manage all bookings from your dashboard.",
  },
  {
    number: "04",
    icon: ThumbsUp,
    title: "Get Quality Help",
    description: "Receive trusted service at your doorstep. Rate your experience and build long-term relationships.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-secondary/5 py-20 lg:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            Simple Process
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting trusted domestic help has never been easier. Follow these simple steps to find your perfect match.
          </p>
        </motion.div>

        <div className="relative mt-16">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-24 hidden h-[calc(100%-6rem)] w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary via-accent to-gold lg:block" />

          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Number */}
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
                    {step.number}
                    <div className="absolute -z-10 h-20 w-20 animate-pulse-soft rounded-full bg-primary/20" />
                  </div>
                </div>

                {/* Content */}
                <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-brand">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <step.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
