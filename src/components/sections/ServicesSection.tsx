import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, Sparkles, Baby, Heart, Shirt, Car, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const serviceKeys = [
  { id: "cooking",   icon: ChefHat,   priceRange: "₹100 - ₹300/hr" },
  { id: "cleaning",  icon: Sparkles,  priceRange: "₹80 - ₹200/hr" },
  { id: "childcare", icon: Baby,      priceRange: "₹150 - ₹400/hr" },
  { id: "eldercare", icon: Heart,     priceRange: "₹150 - ₹350/hr" },
  { id: "laundry",   icon: Shirt,     priceRange: "₹60 - ₹150/hr" },
  { id: "driving",   icon: Car,       priceRange: "₹200 - ₹500/hr" },
];

const serviceColors: Record<string, string> = {
  cooking:   "bg-orange-500/10 text-orange-600",
  cleaning:  "bg-blue-500/10 text-blue-600",
  childcare: "bg-pink-500/10 text-pink-600",
  eldercare: "bg-red-500/10 text-red-600",
  laundry:   "bg-purple-500/10 text-purple-600",
  driving:   "bg-green-500/10 text-green-600",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const ServicesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {t("services.badge")}
          </span>
          <h2 className="mb-4 font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
            {t("services.title")}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {serviceKeys.map((service) => (
            <motion.div key={service.id} variants={itemVariants} className="group">
              <Link
                to={`/workers?service=${service.id}`}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className={`mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${serviceColors[service.id]}`}>
                  <service.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 font-heading text-lg sm:text-xl font-semibold">
                  {t(`services.${service.id}`)}
                </h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">
                  {t(`services.${service.id}_desc`)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{service.priceRange}</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    {t("services.findHelp")} <ArrowRight className="h-4 w-4" />
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
          className="mt-10 text-center"
        >
          <Button asChild size="lg">
            <Link to="/services">
              {t("services.viewAll")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
