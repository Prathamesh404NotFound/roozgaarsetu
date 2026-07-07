import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Briefcase, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  const [roleTab, setRoleTab] = useState<"client" | "worker">("client");
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional local worker marketplace"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="container relative z-10 py-12 lg:py-20">
        {/* Value Prop & Verified Badge */}
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
              <ShieldCheck className="h-4 w-4" /> {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
          >
            RoozgaarSetu
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-base text-white/80 sm:text-lg md:text-xl"
          >
            {t("hero.tagline")}
          </motion.p>
        </div>

        {/* Dual-Path Action Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-4xl mx-auto mb-12">
          {/* Card 1: Clients */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/10 bg-black/45 p-6 sm:p-8 backdrop-blur-md shadow-elevated transition hover:border-primary/50 hover:bg-black/60"
          >
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">{t("hero.hire_title")}</h2>
              <p className="text-sm leading-relaxed text-white/70">{t("hero.hire_desc")}</p>
            </div>

            <div className="mt-6 space-y-3">
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-brand">
                <Link to="/workers">
                  {t("hero.findWorkers")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <div className="text-center">
                <Link to="/booking" className="text-xs font-semibold text-gold hover:underline">
                  {t("hero.quickBook")} &rarr;
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Workers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/10 bg-black/45 p-6 sm:p-8 backdrop-blur-md shadow-elevated transition hover:border-gold/50 hover:bg-black/60"
          >
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/20 text-gold">
                <Briefcase className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">{t("hero.work_title")}</h2>
              <p className="text-sm leading-relaxed text-white/70">{t("hero.work_desc")}</p>
            </div>

            <div className="mt-6 space-y-3">
              <Button asChild size="lg" className="w-full bg-gold hover:bg-gold/90 text-black font-semibold shadow-gold">
                <Link to="/become-worker">
                  {t("hero.becomeWorker")}
                  <UserPlus className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="text-center">
                <Link to="/services" className="text-xs font-semibold text-white/70 hover:text-white hover:underline">
                  {t("hero.exploreCategories")} &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8"
        >
          {/* Tab Selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-xl bg-black/30 p-1 border border-white/5">
              <button
                onClick={() => setRoleTab("client")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                  roleTab === "client"
                    ? "bg-primary text-primary-foreground shadow-sm animate-pulse-soft"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t("hero.hireSteps")}
              </button>
              <button
                onClick={() => setRoleTab("worker")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                  roleTab === "worker"
                    ? "bg-gold text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t("hero.workSteps")}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={roleTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid gap-4 sm:gap-6 sm:grid-cols-3"
            >
              {roleTab === "client" ? (
                <>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">{n}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{t(`hero.step_hire_${n}_title`)}</h4>
                        <p className="text-xs text-white/60">{t(`hero.step_hire_${n}_desc`)}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/25 text-xs font-bold text-gold">{n}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{t(`hero.step_work_${n}_title`)}</h4>
                        <p className="text-xs text-white/60">{t(`hero.step_work_${n}_desc`)}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
