import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Clock, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const stats = [
  { icon: Users, value: "1000+", label: "Professionals" },
  { icon: Star, value: "4.9", label: "Average Rating" },
  { icon: Clock, value: "24hrs", label: "Quick Response" },
  { icon: ShieldCheck, value: "100%", label: "Verified Profiles" },
];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional networking platform"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="container relative z-10 py-20 lg:py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-4 py-1.5 text-sm font-medium text-gold">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-gold" />
              Now Live in Kolhapur
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 font-heading text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
          >
            Connecting Professionals
            <br />
            <span className="text-gold">Building Careers</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 max-w-xl text-lg text-white/80 md:text-xl"
          >
            Discover opportunities and connect with trusted professionals. Build your career with India's leading professional network platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/services">
                Explore Opportunities
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link to="/workers">Find Professionals</Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center gap-6"
          >
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span>Profile Verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span>Skills Certified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span>Trusted Network</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative z-10 border-t border-white/10 bg-secondary/90 backdrop-blur-sm">
        <div className="container py-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
