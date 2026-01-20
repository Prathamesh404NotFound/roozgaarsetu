import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-elevated md:p-12 lg:p-16"
        >
          {/* Background Gradient */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
                Ready to Grow Your Career?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of professionals who trust RoozgaarSetu for their career growth. Get started in minutes!
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/services">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">Talk to Us</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-background/50 p-6 backdrop-blur-sm">
              <h3 className="font-heading text-lg font-semibold">
                Need Immediate Help?
              </h3>
              <p className="text-sm text-muted-foreground">
                Our team is available 24/7 to assist you with any queries or urgent requirements.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:+919876543210"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
