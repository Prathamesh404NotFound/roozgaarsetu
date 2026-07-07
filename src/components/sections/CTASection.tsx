import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const CTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card p-6 shadow-elevated sm:p-10 lg:p-14"
        >
          {/* Background Gradient */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
                {t("cta.title")}
              </h2>
              <p className="mb-6 text-base text-muted-foreground sm:text-lg">
                {t("cta.subtitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/services">
                    {t("cta.getStarted")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/contact">{t("cta.talkToUs")}</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-background/50 p-5 sm:p-6 backdrop-blur-sm">
              <h3 className="font-heading text-lg font-semibold">{t("cta.immediateHelp")}</h3>
              <p className="text-sm text-muted-foreground">{t("cta.support_desc")}</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:+919876543210"
                  className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {t("cta.callNow")}
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("cta.whatsapp")}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
