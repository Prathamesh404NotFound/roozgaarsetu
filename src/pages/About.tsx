import { motion } from "framer-motion";
import { Users, Target, Heart, Award, Linkedin, Twitter, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import teamData from "@/data/team.json";

const values = [
  {
    icon: Heart,
    title: "Trust First",
    description: "We build trust through rigorous verification, transparency, and consistent quality in every interaction.",
  },
  {
    icon: Users,
    title: "Empowering Professionals",
    description: "We're committed to providing meaningful career opportunities and professional growth for all members.",
  },
  {
    icon: Target,
    title: "Technology-Driven",
    description: "We leverage technology to create seamless experiences for both households and workers.",
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "Every worker undergoes skill testing and continuous performance monitoring.",
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
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const About = () => {
  return (
    <Layout>
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
              About RoozgaarSetu
            </h1>
            <p className="text-lg text-white/80">
              Connecting Professionals and Opportunities. We're on a mission to transform how people build their careers through trusted networking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Our Mission
              </span>
              <h2 className="mb-6 font-heading text-2xl font-bold md:text-3xl">
                Building Professional Networks
              </h2>
              <p className="text-lg text-muted-foreground">
                Finding the right professional opportunities has always been a challenge. At RoozgaarSetu, we're solving this by creating a platform that prioritizes verification, transparency, and quality. We believe every professional deserves growth opportunities, and every business deserves access to verified talent.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/5 py-16 lg:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              Our Values
            </span>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">
              What Drives Us
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-brand"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Developer Company */}
      <section className="border-t border-border bg-secondary/5 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-2 text-sm text-muted-foreground">Developed by</p>
            <h3 className="mb-2 font-heading text-xl font-bold">
              {teamData.developerCompany.name}
            </h3>
            <a
              href={teamData.developerCompany.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {teamData.developerCompany.website}
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
