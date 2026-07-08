import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, update } from "firebase/database";
import { ArrowLeft, Loader2, Search, CheckCircle, ShieldAlert, FileText, ChevronDown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { database } from "@/lib/firebase";
import { VerificationBadge, type VerificationTier } from "@/components/ui/VerificationBadge";

interface WorkerRecord {
  uid: string;
  category: string;
  experience: string;
  phone: string;
  city: string;
  bio: string;
  isVerified?: boolean;
  verificationStatus?: VerificationTier;
  idDocumentUrl?: string;
  registeredAt?: string;
  displayName?: string;
  email?: string;
}

interface FirebaseWorker {
  category?: string;
  experience?: string;
  phone?: string;
  city?: string;
  bio?: string;
  isVerified?: boolean;
  verificationStatus?: VerificationTier;
  idDocumentUrl?: string;
  registeredAt?: string;
}

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchWorkersAndUsers = async () => {
    try {
      const [workersSnap, usersSnap] = await Promise.all([
        get(ref(database, "workers")),
        get(ref(database, "users")),
      ]);

      if (workersSnap.exists()) {
        const workersData = workersSnap.val();
        const usersData = usersSnap.exists() ? usersSnap.val() : {};

        const list: WorkerRecord[] = Object.entries(workersData).map(([uid, w]: [string, FirebaseWorker]) => {
          const userObj = usersData[uid] || {};
          return {
            uid,
            category: w.category ?? "",
            experience: w.experience ?? "",
            phone: w.phone ?? "",
            city: w.city ?? "",
            bio: w.bio ?? "",
            isVerified: w.isVerified ?? false,
            verificationStatus: w.verificationStatus ?? (w.isVerified ? "id_verified" : "unverified"),
            idDocumentUrl: w.idDocumentUrl,
            registeredAt: w.registeredAt,
            displayName: userObj.displayName ?? "Worker",
            email: userObj.email ?? "",
          };
        });

        setWorkers(list);
      }
    } catch (err) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkersAndUsers();
  }, []);

  const changeTier = async (uid: string, tier: VerificationTier) => {
    setUpdatingId(uid);
    try {
      const isVerified = (tier === "id_verified");
      await Promise.all([
        update(ref(database, `workers/${uid}`), { verificationStatus: tier, isVerified }),
        update(ref(database, `users/${uid}`), { verificationStatus: tier, isVerified }),
      ]);
      setWorkers((prev) =>
        prev.map((w) => (w.uid === uid ? { ...w, verificationStatus: tier, isVerified } : w))
      );
    } catch (err) {
      console.error("Failed to change verification tier:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = workers.filter((w) => {
    const query = searchTerm.toLowerCase();
    return (
      (w.displayName || "").toLowerCase().includes(query) ||
      (w.category || "").toLowerCase().includes(query) ||
      (w.city || "").toLowerCase().includes(query)
    );
  });

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl font-bold text-white">Workers Profiles</h1>
            <p className="text-white/70">Manage worker verification tiers and credentials</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search workers by name, skill category, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none ring-ring transition focus:ring-2"
              />
            </div>
            <div className="text-sm text-muted-foreground sm:text-right">
              Showing {filtered.length} of {workers.length} workers
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              No worker profiles found.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((w) => (
                <div key={w.uid} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-brand">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">{w.displayName}</h3>
                        <p className="text-xs text-muted-foreground">{w.email}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-primary">
                        {w.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground uppercase">Experience</span>
                        <span className="text-foreground">{w.experience}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-muted-foreground uppercase">Location</span>
                        <span className="text-foreground">{w.city}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-medium text-muted-foreground uppercase">Phone</span>
                        <span className="text-foreground">+91 {w.phone}</span>
                      </div>
                    </div>

                    {/* ID Document Details Panel */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <span className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Government ID Document</span>
                      {w.idDocumentUrl ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium truncate max-w-[200px]">
                              {w.idDocumentUrl.replace("mock://uploaded-documents/", "")}
                            </span>
                          </div>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Simulating View Document for: ${w.idDocumentUrl}`);
                            }}
                            className="text-xs text-primary hover:underline font-semibold"
                          >
                            View document
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No document uploaded yet</span>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-muted-foreground uppercase">Bio</span>
                      <p className="mt-1 text-sm text-foreground line-clamp-3 leading-relaxed">{w.bio}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Current Tier:</span>
                      <VerificationBadge size="sm" status={w.verificationStatus} />
                    </div>

                    {/* Set verification status dropdown */}
                    <div className="relative min-w-[170px]">
                      <select
                        id={`select-verify-tier-${w.uid}`}
                        disabled={updatingId === w.uid}
                        value={w.verificationStatus || "unverified"}
                        onChange={(e) => changeTier(w.uid, e.target.value as VerificationTier)}
                        className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-xs font-semibold outline-none ring-primary transition focus:ring-1"
                      >
                        <option value="unverified">Unverified</option>
                        <option value="phone_verified">Phone Verified</option>
                        <option value="id_verified">ID Verified</option>
                      </select>
                      {updatingId === w.uid ? (
                        <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                      ) : (
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminWorkersPage;
