import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, Bell, Shield, Globe, Palette } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { toast } from "sonner";

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "RoozgaarSetu",
    supportEmail: "support@roozgaarsetu.com",
    supportPhone: "+91 98765 43210",
    commissionRate: 5,
    instantPayoutFee: 2,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl font-bold text-white">Platform Settings</h1>
            <p className="text-white/70">Configure platform-wide settings and preferences</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container max-w-4xl space-y-8">
          {/* General Settings */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">General Settings</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Platform Name</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Support Phone</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2"
                />
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">Financial Settings</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2"
                />
                <p className="text-xs text-muted-foreground">Percentage charged on each transaction</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Instant Payout Fee (%)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.instantPayoutFee}
                  onChange={(e) => setSettings({ ...settings, instantPayoutFee: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-ring transition focus:ring-2"
                />
                <p className="text-xs text-muted-foreground">Fee for instant worker payouts</p>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">System Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Enable Notifications</p>
                  <p className="text-xs text-muted-foreground">Send email notifications for important events</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    settings.enableNotifications ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      settings.enableNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Disable platform for maintenance</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    settings.maintenanceMode ? "bg-destructive" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminSettingsPage;
