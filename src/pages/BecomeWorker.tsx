import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, set } from "firebase/database";
import { Briefcase, MapPin, Phone, Star, FileText, ChevronDown, Loader2, CheckCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import { SEO } from "@/components/SEO";

// ─── Service categories (mirrored from Services.tsx) ─────────────────────────

export const SERVICE_CATEGORIES = [
  { id: "cooking", label: "Cooking" },
  { id: "cleaning", label: "House Cleaning" },
  { id: "childcare", label: "Childcare" },
  { id: "eldercare", label: "Elder Care" },
  { id: "laundry", label: "Laundry & Ironing" },
  { id: "driving", label: "Driver Services" },
] as const;

export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];

// ─── Worker profile shape written to workers/{uid} ────────────────────────────

interface WorkerRegistration {
  uid: string;
  category: ServiceCategoryId;
  categories: string[];
  experience: string;
  phone: string;
  city: string;
  locality?: string;
  bio: string;
  isVerified: boolean;
  verificationStatus: 'unverified' | 'phone_verified' | 'id_verified';
  registeredAt: string;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  category: ServiceCategoryId | "";
  categories: string[];
  experience: string;
  phone: string;
  city: string;
  locality: string;
  bio: string;
}

// Errors are always plain strings — kept separate from FormState to avoid
// type conflicts (e.g. errors.category string vs FormState.category union).
type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  category: "",
  categories: [],
  experience: "",
  phone: "",
  city: "",
  locality: "",
  bio: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

const BecomeWorker = () => {
  const { user, profile, updateUserRole } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Guards ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Not logged in — LoginGate should have handled this, but be defensive
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    // Already a worker or admin — send them straight to their dashboard
    if (profile && profile.role !== "client") {
      navigate("/dashboard/worker", { replace: true });
    }
  }, [user, profile, navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set_ = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined as string | undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.categories || form.categories.length === 0)
      e.category = "Please select at least one service category.";
    if (!form.experience.trim()) e.experience = "Experience is required.";
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.locality.trim()) e.locality = "Locality / Society is required.";
    if (!form.bio.trim() || form.bio.trim().length < 30)
      e.bio = "Bio must be at least 30 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setSubmitting(true);
    try {
      // 1. Write worker-specific data to workers/{uid}
      const workerData: WorkerRegistration = {
        uid: user.uid,
        category: (form.categories[0] || form.category) as ServiceCategoryId,
        categories: form.categories,
        experience: form.experience.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        locality: form.locality.trim(),
        bio: form.bio.trim(),
        isVerified: false,
        verificationStatus: "unverified",
        registeredAt: new Date().toISOString(),
      };
      await set(ref(database, `workers/${user.uid}`), workerData);

      // 2. Upgrade the role on the SAME account — no new account created
      await updateUserRole("worker");

      setSuccess(true);

      // 3. Redirect after a brief success flash
      setTimeout(() => navigate("/dashboard/worker", { replace: true }), 1800);
    } catch (err) {
      console.error("Worker registration failed:", err);
      setErrors({ bio: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (success) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <CheckCircle className="h-20 w-20 text-success" />
            <h2 className="font-heading text-2xl font-bold text-foreground">
              You're now a Worker!
            </h2>
            <p className="text-muted-foreground">Redirecting to your dashboard…</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEO
        title="Become a Worker - Register & Earn with RoozgaarSetu in Kolhapur"
        description="Register as a cook, cleaner, driver, babysitter, or caregiver on RoozgaarSetu. Create your worker profile, get verified, and start receiving job requests in Kolhapur."
        path="/become-worker"
      />
      {/* Hero */}
      <section className="bg-gradient-hero py-14 lg:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 ring-1 ring-white/20">
              No new account needed — upgrade your existing account
            </div>
            <h1 className="mb-4 font-heading text-3xl font-bold text-white md:text-5xl">
              Become a Worker
            </h1>
            <p className="text-lg text-white/80">
              Tell us about your skills and start earning. Your profile goes live
              as soon as you submit.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form card */}
      <section className="py-14 lg:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card-hover">
              <h2 className="mb-6 font-heading text-xl font-semibold">
                Your Worker Profile
              </h2>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">

                {/* Service Category */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Service Categories (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICE_CATEGORIES.map((c) => {
                      const isSelected = form.categories?.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const current = form.categories || [];
                            const next = current.includes(c.id)
                              ? current.filter((x) => x !== c.id)
                              : [...current, c.id];
                            set_("categories", next);
                            set_("category", (next[0] || "") as ServiceCategoryId | "");
                          }}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition-all duration-200 ${isSelected
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border bg-background hover:bg-muted/40 hover:border-gray-300"
                            }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-transparent"
                            }`}>
                            {isSelected && (
                              <svg className="h-3 w-3 fill-none stroke-current stroke-[3px]" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p className="mt-2 text-xs text-destructive">{errors.category}</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label
                    htmlFor="bw-experience"
                    className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                  >
                    <Star className="h-4 w-4 text-primary" />
                    Years of Experience
                  </label>
                  <input
                    id="bw-experience"
                    type="text"
                    placeholder="e.g. 3 years, Fresher, 6 months…"
                    value={form.experience}
                    onChange={(e) => set_("experience", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition placeholder:text-muted-foreground/60 focus:ring-2"
                  />
                  {errors.experience && (
                    <p className="mt-1 text-xs text-destructive">{errors.experience}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="bw-phone"
                    className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    Mobile Number
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
                    <span className="flex items-center border-r border-border bg-muted/30 px-3 text-sm font-medium text-muted-foreground">
                      +91
                    </span>
                    <input
                      id="bw-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) =>
                        set_("phone", e.target.value.replace(/\D/g, ""))
                      }
                      className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* City & Locality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bw-city"
                      className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      City
                    </label>
                    <input
                      id="bw-city"
                      type="text"
                      placeholder="e.g. Mumbai, Pune, Delhi…"
                      value={form.city}
                      onChange={(e) => set_("city", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition placeholder:text-muted-foreground/60 focus:ring-2"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-destructive">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bw-locality"
                      className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      Locality / Society
                    </label>
                    <input
                      id="bw-locality"
                      type="text"
                      placeholder="e.g. Gokuldham Society…"
                      value={form.locality}
                      onChange={(e) => set_("locality", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition placeholder:text-muted-foreground/60 focus:ring-2"
                    />
                    {errors.locality && (
                      <p className="mt-1 text-xs text-destructive">{errors.locality}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bw-bio"
                    className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    Short Bio
                    <span className="ml-auto text-xs text-muted-foreground">
                      {form.bio.length} / 300
                    </span>
                  </label>
                  <textarea
                    id="bw-bio"
                    rows={4}
                    maxLength={300}
                    placeholder="Tell clients a little about yourself, your experience, and why you're the right person for the job…"
                    value={form.bio}
                    onChange={(e) => set_("bio", e.target.value)}
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition placeholder:text-muted-foreground/60 focus:ring-2"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-xs text-destructive">{errors.bio}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  id="btn-become-worker-submit"
                  type="submit"
                  disabled={submitting}
                  className="
                    flex w-full items-center justify-center gap-2
                    rounded-xl bg-primary px-6 py-3.5
                    text-sm font-semibold text-primary-foreground
                    shadow-brand transition-all duration-200
                    hover:bg-primary/90 hover:-translate-y-px hover:shadow-card-hover
                    active:translate-y-0
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  "
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering…
                    </>
                  ) : (
                    "Register as a Worker"
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  This upgrades your existing account. No new login required.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default BecomeWorker;
