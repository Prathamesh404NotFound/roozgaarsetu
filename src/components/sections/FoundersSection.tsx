import { motion } from "framer-motion";
import { Linkedin, Twitter, Mail } from "lucide-react";
import shivaniImage from "@/assets/Team/Shivani-Kale.jpg";
import sureshImage from "@/assets/Team/Dr. Suresh Mane.jpg";
import kiranImage from "@/assets/Team/Kiran-Ingawale.jpg";

const founders = [
    {
        id: "f1",
        name: "Dr. Shivani Kale",
        role: "Founder",
        bio: "Academic expertise in technology innovation and professional networking. Leading RoozgaarSetu's mission to transform career opportunities.",
        image: shivaniImage,
        social: {
            linkedin: "https://linkedin.com/in/shivani-kale",
            twitter: "https://twitter.com/shivani_kale",
            email: "shivani@roozgaarsetu.com"
        }
    },
    {
        id: "f3",
        name: "Dr. Suresh Mane",
        role: "Co-Founder & Advisor",
        bio: "Research background in technology-driven social solutions and innovation management. Guiding RoozgaarSetu's strategic direction.",
        image: sureshImage,
        social: {
            linkedin: "https://linkedin.com/in/suresh-mane",
            twitter: "https://twitter.com/suresh_mane",
            email: "suresh@roozgaarsetu.com"
        }
    },
    {
        id: "f2",
        name: "Kiran Ingawale",
        role: "Co-Founder",
        bio: "Industry experience in platform development and digital marketplace strategies. Building technology that empowers professionals and businesses.",
        image: kiranImage,
        social: {
            linkedin: "https://linkedin.com/in/kiran-ingawale",
            twitter: "https://twitter.com/kiran_ingawale",
            email: "kiran@roozgaarsetu.com"
        }
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

export const FoundersSection = () => {
    return (
        <section className="py-20 lg:py-28 bg-secondary/5">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center mb-16"
                >
                    <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        Meet Our Leadership
                    </span>
                    <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
                        Founded by Visionaries
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Our founders bring together expertise in technology, business, and social impact to create meaningful professional connections.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid gap-8 md:grid-cols-3"
                >
                    {founders.map((founder) => (
                        <motion.div
                            key={founder.id}
                            variants={itemVariants}
                            className="group text-center"
                        >
                            {/* Founder Image */}
                            <div className="relative mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                                {founder.image ? (
                                    <img
                                        src={founder.image}
                                        alt={founder.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <span className="font-heading text-3xl font-bold text-primary">
                                            {founder.name.split(" ").map((n) => n[0]).join("")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Founder Info */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-heading text-xl font-semibold text-foreground">
                                        {founder.name}
                                    </h3>
                                    <p className="text-sm font-medium text-primary">
                                        {founder.role}
                                    </p>
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {founder.bio}
                                </p>

                                {/* Social Links */}
                                <div className="flex justify-center gap-3 pt-2">
                                    <a
                                        href={founder.social.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                        aria-label={`${founder.name} LinkedIn`}
                                    >
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={founder.social.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                        aria-label={`${founder.name} Twitter`}
                                    >
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={`mailto:${founder.social.email}`}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                        aria-label={`${founder.name} Email`}
                                    >
                                        <Mail className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
