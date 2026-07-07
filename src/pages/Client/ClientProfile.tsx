import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ref, update } from "firebase/database";
import { User, Phone, MapPin, Loader2, CheckCircle, Pencil, Bell, Shield, Globe, CreditCard, ToggleLeft, ToggleRight, Settings, DollarSign } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";

type FormErrors = Partial<Record<"displayName" | "phone" | "city", string>>;

const ClientProfile = () => {
  const { user, profile } = useAuth();

  const [form, setForm] = useState({
    displayName: profile?.displayName ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    locality: (profile as any)?.locality ?? "",
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: (profile as any)?.preferences?.emailNotifications ?? true,
    smsNotifications: (profile as any)?.preferences?.smsNotifications ?? false,
    pushNotifications: (profile as any)?.preferences?.pushNotifications ?? true,
    language: (profile as any)?.preferences?.language ?? "en",
    currency: (profile as any)?.preferences?.currency ?? "INR",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        phone: profile.phone ?? "",
        city: profile.city ?? "",
        locality: (profile as any).locality ?? "",
      });
      setPreferences({
        emailNotifications: (profile as any)?.preferences?.emailNotifications ?? true,
        smsNotifications: (profile as any)?.preferences?.smsNotifications ?? false,
        pushNotifications: (profile as any)?.preferences?.pushNotifications ?? true,
        language: (profile as any)?.preferences?.language ?? "en",
        currency: (profile as any)?.preferences?.currency ?? "INR",
      });
    }
  }, [profile]);

  const set_ = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
    setSaved(false);
  };

  const setPref = (key: keyof typeof preferences, value: any) => {
    setPreferences((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const validate = () => {
    const e: FormErrors = {};
    if (!form.displayName.trim()) e.displayName = "Name is required.";
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
      e.phone = "Enter a valid 10-digit Indian mobile number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSaving(true);
    try {
      await update(ref(database, `users/${user.uid}`), {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        locality: form.locality.trim() || null,
        preferences: preferences,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-2xl font-bold text-white">My Profile</h1>
            <p className="mt-1 text-white/70">Manage your personal information</p>
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
            {/* Avatar */}
            <div className="mb-6 flex items-center gap-4">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full border-2 border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{profile?.displayName}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                  {profile?.role}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
              <div className="mb-5 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Edit Details</h2>
              </div>

              <form onSubmit={handleSave} noValidate className="space-y-5">
                {/* Display Name */}
                <div>
                  <label htmlFor="cp-name" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-primary" /> Full Name
                  </label>
                  <input
                    id="cp-name"
                    type="text"
                    value={form.displayName}
                    onChange={(e) => set_("displayName", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition focus:ring-2"
                  />
                  {errors.displayName && <p className="mt-1 text-xs text-destructive">{errors.displayName}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="cp-phone" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-primary" /> Mobile Number (optional)
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
                    <span className="flex items-center border-r border-border bg-muted/30 px-3 text-sm font-medium text-muted-foreground">+91</span>
                    <input
                      id="cp-phone"
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
                    <label htmlFor="cp-city" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" /> City
                    </label>
                    <input
                      id="cp-city"
                      type="text"
                      value={form.city}
                      onChange={(e) => set_("city", e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition focus:ring-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="cp-locality" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" /> Locality / Society
                    </label>
                    <input
                      id="cp-locality"
                      type="text"
                      value={form.locality}
                      onChange={(e) => set_("locality", e.target.value)}
                      placeholder="e.g. Gokuldham Society"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition focus:ring-2"
                    />
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="mt-8 pt-8 border-t border-border">
                  <div className="mb-5 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-lg font-semibold">Preferences</h2>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive booking updates via email</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPref("emailNotifications", !preferences.emailNotifications)}
                        className="transition"
                      >
                        {preferences.emailNotifications ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive booking updates via SMS</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPref("smsNotifications", !preferences.smsNotifications)}
                        className="transition"
                      >
                        {preferences.smsNotifications ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Push Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive in-app notifications</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPref("pushNotifications", !preferences.pushNotifications)}
                        className="transition"
                      >
                        {preferences.pushNotifications ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Language & Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pref-language" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                        <Globe className="h-4 w-4 text-primary" /> Language
                      </label>
                      <select
                        id="pref-language"
                        value={preferences.language}
                        onChange={(e) => setPref("language", e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition focus:ring-2"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="pref-currency" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-primary" /> Currency
                      </label>
                      <select
                        id="pref-currency"
                        value={preferences.currency}
                        onChange={(e) => setPref("currency", e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-ring transition focus:ring-2"
                      >
                        <option value="INR">₹ Indian Rupee (INR)</option>
                        <option value="USD">$ US Dollar (USD)</option>
                        <option value="EUR">€ Euro (EUR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  id="btn-client-profile-save"
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

export default ClientProfile;
