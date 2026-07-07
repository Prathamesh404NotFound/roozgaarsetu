import { motion } from "framer-motion";
import { Linkedin, Twitter, Mail, User, LogIn, LogOut } from "lucide-react";
import { useFirebase } from "@/context/FirebaseContext";
import { useState } from "react";

// Helper: derive initials from a display name
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0]?.[0] ?? "U").toUpperCase();
}

const founders = [
    {
        id: "f1",
        name: "Dr. Shivani Kale",
        role: "Founder",
        bio: "Academic expertise in technology innovation and professional networking. Leading RoozgaarSetu's mission to transform career opportunities.",
        image: "/Team/Shivani-Kale.jpg",
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
        image: "/Team/Dr. Suresh Mane.jpg",
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
        image: "/Team/Kiran-Ingawale.jpg",
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
    const { user, userProfile, loading, signInWithGoogle, signOut } = useFirebase();
    const [imageLoadError, setImageLoadError] = useState(false);

    // Reset image error when user changes
    const handleUserImageError = () => {
        setImageLoadError(true);
    };

    const displayName = user?.displayName || user?.email || 'User';
    const initials = getInitials(displayName);
    const hasPhoto = user?.photoURL && !imageLoadError;

    // Founder image component with error handling
    const FounderImage = ({ name, image }: { name: string; image: string }) => {
        const [imageError, setImageError] = useState(false);
        const founderInitials = getInitials(name);

        if (imageError || !image) {
            return (
                <div className="flex h-full w-full items-center justify-center">
                    <span className="font-heading text-3xl font-bold text-primary">
                        {founderInitials}
                    </span>
                </div>
            );
        }

        return (
            <img
                src={image}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
            />
        );
    };

    return (
        <section className="py-20 lg:py-28 bg-secondary/5">
            <div className="container">
                {/* Login Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center mb-16"
                >
                    <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        Login to Connect
                    </span>
                    <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
                        Join Our Professional Network
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Sign in to access exclusive features and connect with our founders.
                    </p>

                    {user ? (
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                                    {hasPhoto ? (
                                        <img
                                            src={user.photoURL}
                                            alt={displayName}
                                            className="h-full w-full rounded-full object-cover"
                                            onError={handleUserImageError}
                                        />
                                    ) : (
                                        <span className="font-heading font-bold text-primary text-sm">
                                            {initials}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Welcome, {displayName}</p>
                                    <p className="text-sm text-muted-foreground">You're logged in as {userProfile?.role || 'user'}</p>
                                </div>
                            </div>
                            <button
                                onClick={signOut}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-lg bg-background border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                            >
                                <LogOut className="h-4 w-4" />
                                {loading ? 'Signing out...' : 'Sign Out'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={signInWithGoogle}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            <LogIn className="h-4 w-4" />
                            {loading ? 'Signing in...' : 'Sign in with Google'}
                        </button>
                    )}
                </motion.div>

                {/* Founders Section - Only visible when logged in */}
                {user && (
                    <>
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
                                        <FounderImage name={founder.name} image={founder.image} />
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
                    </>
                )}
            </div>
        </section>
    );
};
