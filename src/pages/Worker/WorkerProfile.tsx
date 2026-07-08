import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ref, get, update } from "firebase/database";
import {
  Briefcase, Star, Phone, MapPin, FileText,
  ToggleLeft, ToggleRight, Loader2, CheckCircle, ChevronDown,
  UploadCloud, CheckCircle2, ShieldAlert, FileCheck, Circle,
  Clock, DollarSign, Shield, Settings, Bell, Calendar, Zap
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/pages/BecomeWorker";
import { queueOfflineAction } from "@/lib/offlineManager";
import { VerificationBadge, type VerificationTier } from "@/components/ui/VerificationBadge";
import type { WorkerRecord } from "@/types";

interface ServicePreferences {
  hourlyRate?: number;
  preferredHours?: { start: string; end: string };
  workingDays?: string[];
  instantPayoutEnabled?: boolean;
  urgentJobAlerts?: boolean;
}

type FormErrors = Partial<Record<keyof Omit<WorkerRecord, "uid" | "registeredAt" | "isVerified" | "availability">, string>>;

const WorkerProfile = () => {
  const { user } = useAuth();

  const [form, setForm] = useState<Omit<WorkerRecord, "uid" | "registeredAt" | "isVerified"> & { categories?: string[] }>({
    category: "",
    categories: [],
    experience: "",
    phone: "",
    city: "",
    locality: "",
    bio: "",
    availability: true,
  });
  const [servicePreferences, setServicePreferences] = useState({
    hourlyRate: 100,
    preferredHours: { start: "08:00", end: "18:00" },
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    instantPayoutEnabled: true,
    urgentJobAlerts: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Verification status details
  const [verificationStatus, setVerificationStatus] = useState<VerificationTier>("unverified");
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | undefined>(undefined);

  // Simulated file uploader states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Load existing worker record
  useEffect(() => {
    if (!user) return;
    get(ref(database, `workers/${user.uid}`)).then((snap) => {
      if (snap.exists()) {
        const data = snap.val() as WorkerRecord;
        setForm({
          category: data.category ?? "",
          categories: data.categories ?? (data.category ? [data.category] : []),
          experience: data.experience ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          locality: data.locality ?? "",
          bio: data.bio ?? "",
          availability: data.availability ?? true,
        });
        setIsVerified(data.isVerified ?? false);
        setVerificationStatus(data.verificationStatus ?? "unverified");
        setIdDocumentUrl(data.idDocumentUrl);

        // Load service preferences
        if ((data as WorkerRecord & { servicePreferences?: ServicePreferences }).servicePreferences) {
          setServicePreferences((prev) => ({
            ...prev,
            ...(data as WorkerRecord & { servicePreferences?: ServicePreferences }).servicePreferences,
          }));
        }
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
    if (!form.categories || form.categories.length === 0) e.category = "Please select at least one category.";
    if (!form.experience.trim()) e.experience = "Experience is required.";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit number.";
    if (!form.city.trim()) e.city = "City is required.";
    if (form.bio.trim().length < 30) e.bio = "Bio must be at least 30 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSaving(true);
    try {
      // If phone saved matches a valid schema and we are "unverified", push to "phone_verified"
      let nextStatus = verificationStatus;
      if (verificationStatus === "unverified" && form.phone) {
        nextStatus = "phone_verified";
        setVerificationStatus("phone_verified");
      }

      const isDeviceOffline = !navigator.onLine;
      const updateData = {
        ...form,
        category: form.categories?.[0] || form.category || "",
        categories: form.categories || [],
        verificationStatus: nextStatus,
        servicePreferences: servicePreferences,
        updatedAt: new Date().toISOString(),
      };

      const userUpdateData = {
        phone: form.phone,
        city: form.city,
        locality: form.locality || null,
        categories: form.categories || [],
        verificationStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      if (isDeviceOffline) {
        queueOfflineAction("toggle_availability", `workers/${user.uid}`, updateData, "Update profile & availability");
        queueOfflineAction("toggle_availability", `users/${user.uid}`, userUpdateData, "Sync user profile");
        setSaved(true);
      } else {
        await update(ref(database, `workers/${user.uid}`), updateData);
        await update(ref(database, `users/${user.uid}`), userUpdateData);
        setSaved(true);
      }

      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Mock document uploader trigger
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          setTimeout(async () => {
            const mockUrl = `mock://uploaded-documents/${file.name}`;

            // Advance status from unverified -> phone_verified if needed, else keep status
            // The uploaded ID document is sent and remains pending review.
            const targetStatus = verificationStatus === "unverified" ? "phone_verified" : verificationStatus;

            try {
              await update(ref(database, `workers/${user.uid}`), {
                idDocumentUrl: mockUrl,
                verificationStatus: targetStatus,
              });

              await update(ref(database, `users/${user.uid}`), {
                verificationStatus: targetStatus,
              });

              setIdDocumentUrl(mockUrl);
              setVerificationStatus(targetStatus);
              setUploadSuccess(true);
              setUploading(false);
            } catch (err) {
              console.error(err);
              setUploading(false);
            }
          }, 500);

          return 100;
        }
        return prev + 20;
      });
    }, 150);
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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-white">Worker Profile Settings</h1>
              <VerificationBadge status={verificationStatus} />
            </div>
            <p className="mt-1 text-white/70">Update your preferences and manage your verification status</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-12">

            {/* Form Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-7"
            >
              <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">Edit details</h3>
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

                  {/* Service Categories */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-primary" /> Service Categories (Select all that apply)
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
                              set_("category", next[0] || "");
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
                    {errors.category && <p className="mt-2 text-xs text-destructive">{errors.category}</p>}
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

                  {/* City & Locality */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div>
                      <label htmlFor="wp-locality" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4 text-primary" /> Locality / Society
                      </label>
                      <input
                        id="wp-locality"
                        type="text"
                        value={form.locality ?? ""}
                        onChange={(e) => set_("locality", e.target.value)}
                        placeholder="e.g. Gokuldham Society"
                        className={inputCls}
                      />
                    </div>
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

                  {/* Service Preferences Section */}
                  <div className="mt-8 pt-8 border-t border-border">
                    <div className="mb-5 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      <h3 className="font-heading text-lg font-semibold">Service Preferences</h3>
                    </div>

                    {/* Hourly Rate */}
                    <div className="mb-6">
                      <label htmlFor="wp-hourly-rate" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-primary" /> Hourly Rate (₹)
                      </label>
                      <input
                        id="wp-hourly-rate"
                        type="number"
                        min="50"
                        max="2000"
                        step="50"
                        value={servicePreferences.hourlyRate}
                        onChange={(e) => setServicePreferences(p => ({ ...p, hourlyRate: parseInt(e.target.value) || 100 }))}
                        className={inputCls}
                      />
                    </div>

                    {/* Working Hours */}
                    <div className="mb-6 grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="wp-start-time" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-primary" /> Start Time
                        </label>
                        <input
                          id="wp-start-time"
                          type="time"
                          value={servicePreferences.preferredHours.start}
                          onChange={(e) => setServicePreferences(p => ({ ...p, preferredHours: { ...p.preferredHours, start: e.target.value } }))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label htmlFor="wp-end-time" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-primary" /> End Time
                        </label>
                        <input
                          id="wp-end-time"
                          type="time"
                          value={servicePreferences.preferredHours.end}
                          onChange={(e) => setServicePreferences(p => ({ ...p, preferredHours: { ...p.preferredHours, end: e.target.value } }))}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Working Days */}
                    <div className="mb-6">
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-primary" /> Working Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setServicePreferences(p => ({
                                ...p,
                                workingDays: p.workingDays.includes(day)
                                  ? p.workingDays.filter(d => d !== day)
                                  : [...p.workingDays, day]
                              }));
                            }}
                            className={`px-3 py-2 text-xs font-medium rounded-lg transition ${servicePreferences.workingDays.includes(day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle Preferences */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Instant Payout</p>
                            <p className="text-xs text-muted-foreground">Enable same-day payout with 5% fee</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setServicePreferences(p => ({ ...p, instantPayoutEnabled: !p.instantPayoutEnabled }))}
                          className="transition"
                        >
                          {servicePreferences.instantPayoutEnabled ? (
                            <ToggleRight className="h-6 w-6 text-primary" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Urgent Job Alerts</p>
                            <p className="text-xs text-muted-foreground">Get notified for urgent job requests</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setServicePreferences(p => ({ ...p, urgentJobAlerts: !p.urgentJobAlerts }))}
                          className="transition"
                        >
                          {servicePreferences.urgentJobAlerts ? (
                            <ToggleRight className="h-6 w-6 text-primary" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
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

            {/* Verification Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-5 space-y-6"
            >
              {/* verification status timeline details */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                <h3 className="mb-3 font-heading text-lg font-semibold text-foreground">Verification Checklist</h3>
                <p className="mb-6 text-xs text-muted-foreground leading-relaxed">
                  Become a trusted helper on RoozgaarSetu. High verification tiers attract 3x more hirings and job requests.
                </p>

                <div className="relative border-l border-border pl-6 space-y-8">
                  {/* Step 1: Phone */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ring-primary">
                      {form.phone ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">Tier 1: Phone Verified</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.phone ? "Saved and verified successfully." : "Enter a valid phone number in profile settings and save."}
                    </p>
                  </div>

                  {/* Step 2: ID */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ring-primary">
                      {verificationStatus === "id_verified" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : idDocumentUrl ? (
                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">Tier 2: Government ID Verification</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {verificationStatus === "id_verified"
                        ? "ID successfully checked and verified."
                        : idDocumentUrl
                          ? "ID Document submitted. Awaiting admin review."
                          : "Upload a photo or PDF of Aadhaar card, PAN card, or Driver License."}
                    </p>
                  </div>

                </div>
              </div>

              {/* ID document upload interface */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                <h3 className="mb-1.5 font-heading text-lg font-semibold text-foreground">Document Upload</h3>
                <p className="mb-4 text-xs text-muted-foreground">Upload files in JPEG or PDF format. Max 5MB.</p>

                {idDocumentUrl ? (
                  <div className="rounded-xl border border-dashed border-success/30 bg-success/5 p-5 text-center">
                    <FileCheck className="mx-auto h-8 w-8 text-success mb-2" />
                    <p className="text-sm font-semibold text-foreground">Document Uploaded Successfully</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-full italic">
                      {idDocumentUrl.replace("mock://uploaded-documents/", "")}
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Pending Review
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <label className="text-xs text-primary hover:underline cursor-pointer font-medium">
                        Change File
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 p-6 hover:bg-muted/20 cursor-pointer transition">
                      <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-semibold">Select Government ID Card</span>
                      <span className="text-xs text-muted-foreground mt-1">Aadhaar, Passport, or PAN card</span>

                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            Uploading Document...
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WorkerProfile;
