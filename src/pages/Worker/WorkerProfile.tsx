import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ref, get, update } from "firebase/database";
import {
  Briefcase, Star, Phone, MapPin, FileText,
  ToggleLeft, ToggleRight, Loader2, CheckCircle, ChevronDown,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/pages/BecomeWorker";
import type { WorkerRecord } from "@/types";

type FormErrors = Partial<Record<keyof Omit<WorkerRecord, "uid" | "registeredAt" | "isVerified" | "availability">, string>>;

const WorkerProfile = () => {
  const { user } = useAuth();

  const [form, setForm] = useState<Omit<WorkerRecord, "uid" | "registeredAt" | "isVerified">>({
    category:     "",
    experience:   "",
    phone:        "",
    city:         "",
    bio:          "",
    availability: true,
  });
  const [errors, setErrors]       = useState<FormErrors>({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Load existing worker record
  useEffect(() => {
    if (!user) return;
    get(ref(database, `workers/${user.uid}`)).then((snap) => {
      if (snap.exists()) {
        const data = snap.val() as WorkerRecord;
        setForm({
          category:     data.category ?? "",
          experience:   data.experience ?? "",
          phone:        data.phone ?? "",
          city:         data.city ?? "",
          bio:          data.bio ?? "",
          availability: data.availability ?? true,
        });
        setIsVerified(data.isVerified ?? false);
      }
      setLoading(false);
    });
  }, [user]);

  const set_ = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k !== "availability") setErrors((p) => ({ ...p, [k]: undefined }));
    setSaved(false);
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.category)             e.category   = "Please select a category.";
    if (!form.experience.trim())    e.experience  = "Experience is required.";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit number.";
    if (!form.city.trim())          e.city        = "City is required.";
    if (form.bio.trim().length < 30) e.bio        = "Bio must be at least 30 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSaving(true);
    try {
      await update(ref(database, `workers/${user.uid}`), {
        ...form,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition focus:ring-2 placeholder:text-muted-foreground/60";

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-white">Worker Profile</h1>
              {isVerified && (
                <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-200 ring-1 ring-green-400/30">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-white/70">Update your skills, availability and bio</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-xl"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
              <form onSubmit={handleSave} noValidate className="space-y-5">

                {/* Availability toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Available for work</p>
                    <p className="text-xs text-muted-foreground">Toggle off to pause incoming requests</p>
                  </div>
                  <button
                    type="button"
                    id="toggle-availability"
                    onClick={() => set_("availability", !form.availability)}
                    className="text-primary transition hover:opacity-80"
                  >
                    {form.availability
                      ? <ToggleRight className="h-8 w-8" />
                      : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
                  </button>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="wp-category" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="h-4 w-4 text-primary" /> Service Category
                  </label>
                  <div className="relative">
                    <select
                      id="wp-category"
                      value={form.category}
                      onChange={(e) => set_("category", e.target.value)}
                      className={`${inputCls} appearance-none`}
                    >
                      <option value="" disabled>Select a category…</option>
                      {SERVICE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category}</p>}
                </div>

                {/* Experience */}
                <div>
                  <label htmlFor="wp-experience" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <Star className="h-4 w-4 text-primary" /> Years of Experience
                  </label>
                  <input
                    id="wp-experience"
                    type="text"
                    value={form.experience}
                    onChange={(e) => set_("experience", e.target.value)}
                    placeholder="e.g. 3 years, Fresher"
                    className={inputCls}
                  />
                  {errors.experience && <p className="mt-1 text-xs text-destructive">{errors.experience}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="wp-phone" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-primary" /> Mobile Number
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
                    <span className="flex items-center border-r border-border bg-muted/30 px-3 text-sm font-medium text-muted-foreground">+91</span>
                    <input
                      id="wp-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => set_("phone", e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="wp-city" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-primary" /> City
                  </label>
                  <input
                    id="wp-city"
                    type="text"
                    value={form.city}
                    onChange={(e) => set_("city", e.target.value)}
                    placeholder="e.g. Pune"
                    className={inputCls}
                  />
                  {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="wp-bio" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-primary" /> Bio
                    <span className="ml-auto text-xs text-muted-foreground">{form.bio.length} / 300</span>
                  </label>
                  <textarea
                    id="wp-bio"
                    rows={4}
                    maxLength={300}
                    value={form.bio}
                    onChange={(e) => set_("bio", e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                  {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio}</p>}
                </div>

                <button
                  id="btn-worker-profile-save"
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default WorkerProfile;
