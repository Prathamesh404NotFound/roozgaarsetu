import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ref, get, update, query, orderByChild, equalTo, onValue } from "firebase/database";
import {
  Briefcase, CheckCircle2, XCircle, Clock, IndianRupee,
  Loader2, User, TrendingUp, Lock, Wallet, AlertTriangle, ShieldCheck,
  MapPin, ToggleLeft, ToggleRight, ArrowRight, Zap, RefreshCw, Info, Wifi, WifiOff,
  Calendar, BarChart3, History, Download
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import { SERVICE_CATEGORIES } from "@/pages/BecomeWorker";
import type { Booking, BookingStatus, PaymentStatus } from "@/types";
import { getLocalityCoords, getDistanceKm } from "@/lib/location";
import { queueOfflineAction, getOfflineQueue, syncOfflineQueue } from "@/lib/offlineManager";
import { toast } from "sonner";

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  accepted: { label: "Accepted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700 border-red-200" },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Awaiting Deposit", className: "bg-muted text-muted-foreground border-border" },
  held: { label: "Escrow Held", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  released: { label: "Released", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  refunded: { label: "Refunded", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  disputed: { label: "Disputed", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const cfg = PAYMENT_STATUS_CONFIG[status] || { label: "Unknown", className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <Lock className="h-3 w-3 inline" />
      {cfg.label}
    </span>
  );
};

interface DemandResult {
  categoryId: string;
  categoryLabel: string;
  count: number;
  level: "High" | "Medium" | "Low";
}

interface RouteStop {
  booking: Booking;
  distanceFromPrevious: number;
}

const WorkerDashboard = () => {
  const { user, profile } = useAuth();

  // Base dashboard states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // New States
  const [availability, setAvailability] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueLength, setOfflineQueueLength] = useState(0);
  const [demandHints, setDemandHints] = useState<DemandResult[]>([]);
  const [payoutModalBooking, setPayoutModalBooking] = useState<Booking | null>(null);
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  // Sync state with offline queue
  const updateQueueStatus = () => {
    const q = getOfflineQueue();
    setOfflineQueueLength(q.length);
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const q = query(
        ref(database, "bookings"),
        orderByChild("workerId"),
        equalTo(user.uid)
      );
      const snap = await get(q);
      if (snap.exists()) {
        const data = snap.val() as Record<string, Booking>;
        const list = Object.entries(data).map(([id, b]) => ({
          ...b,
          id,
          paymentStatus: b.paymentStatus || "pending",
        }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBookings(list);
      } else {
        setBookings([]);
      }
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load demand indicators
  const loadDemandIndicators = async (workerLocality: string) => {
    try {
      // Query bookings to identify volume in worker's locality
      const snap = await get(ref(database, "bookings"));
      if (!snap.exists()) return;

      const data = snap.val() as Record<string, Booking>;
      const targetLocality = (workerLocality || "").trim().toLowerCase();

      // Count bookings in last 30 days matching worker area
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      const counts: Record<string, number> = {};
      SERVICE_CATEGORIES.forEach((c) => { counts[c.id] = 0; });

      Object.values(data).forEach((b) => {
        if (!b.createdAt || !b.category) return;
        const bTime = new Date(b.createdAt).getTime();
        const matchesLocality = b.locality && b.locality.trim().toLowerCase().includes(targetLocality);

        if (now - bTime < thirtyDaysMs && matchesLocality) {
          counts[b.category] = (counts[b.category] || 0) + 1;
        }
      });

      const results: DemandResult[] = SERVICE_CATEGORIES.map((c) => {
        const count = counts[c.id] || 0;
        let level: DemandResult["level"] = "Low";
        if (count >= 3) level = "High";
        else if (count >= 1) level = "Medium";

        return {
          categoryId: c.id,
          categoryLabel: c.label,
          count,
          level,
        };
      });

      setDemandHints(results);
    } catch (e) {
      console.error("Failed to load demand indicators:", e);
    }
  };

  // Setup connection listeners & initial syncs
  useEffect(() => {
    if (!user) return;

    // Listen to offline queue changes
    window.addEventListener("offline-queue-changed", updateQueueStatus);
    updateQueueStatus();

    // Fetch availability
    const availRef = ref(database, `workers/${user.uid}/availability`);
    const unsubscribeAvail = onValue(availRef, (snap) => {
      if (snap.exists()) {
        setAvailability(snap.val());
      }
    });

    // Listen to Firebase RTDB connected status
    const connectedRef = ref(database, ".info/connected");
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      setIsOnline(isConnected);
      if (isConnected) {
        syncOfflineQueue().then(() => {
          fetchBookings();
        });
      }
    });

    // Initial triggers
    fetchBookings();
    loadDemandIndicators(profile?.locality || "Gokuldham");

    return () => {
      window.removeEventListener("offline-queue-changed", updateQueueStatus);
      unsubscribeAvail();
      unsubscribeConnected();
    };
  }, [user, profile]);

  // Handle availability toggle (offline first)
  const handleToggleAvailability = async () => {
    if (!user) return;
    const nextAvail = !availability;
    setAvailability(nextAvail); // Optimistic UI update

    const dbPathWorker = `workers/${user.uid}`;
    const description = `Change availability to ${nextAvail ? "Available" : "Busy"}`;

    if (!isOnline) {
      queueOfflineAction("toggle_availability", dbPathWorker, { availability: nextAvail }, description);
    } else {
      try {
        await update(ref(database, dbPathWorker), { availability: nextAvail });
        await update(ref(database, `users/${user.uid}`), { availability: nextAvail });
        toast.success(`Availability updated successfully.`);
      } catch (err) {
        console.error("Failed to update availability:", err);
        setAvailability(availability); // Revert optimistic update
        toast.error("Failed to update availability.");
      }
    }
  };

  // Status changes (Accept / Decline / Complete Work) - Offline Safe
  const changeStatus = async (bookingId: string, nextStatus: BookingStatus) => {
    setActing(bookingId);
    const dbPath = `bookings/${bookingId}`;
    let desc = nextStatus === "accepted" ? "Accept job request" : "Complete work assignment";
    if (nextStatus === "declined") desc = "Decline job request";

    // Optimistic state updates
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );

    if (!isOnline) {
      queueOfflineAction(
        nextStatus === "accepted" ? "accept_job" : "complete_job",
        dbPath,
        { status: nextStatus },
        desc
      );
      setActing(null);
    } else {
      try {
        await update(ref(database, dbPath), {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        });
        toast.success(`Action: "${desc}" verified.`);
        await fetchBookings();
      } catch (err) {
        console.error("Action write failed:", err);
        toast.error("Failed to process action. Reverting status.");
        fetchBookings(); // Revert to correct server state
      } finally {
        setActing(null);
      }
    }
  };

  // Escrow direct payout release (Same-Day get paid now)
  const triggerInstantPayout = async () => {
    if (!payoutModalBooking) return;
    setPayoutProcessing(true);
    const b = payoutModalBooking;
    const fee = Math.round((b.amount || 0) * 0.05);
    const net = (b.amount || 0) - fee;

    try {
      await update(ref(database, `bookings/${b.id}`), {
        paymentStatus: "released",
        payoutType: "instant",
        payoutFeeDeduction: fee,
        actualPayoutAmount: net,
        updatedAt: new Date().toISOString(),
      });

      toast.success(`Success! ₹${net} has been instantly transferred (₹${fee} processing fee applied).`);
      setPayoutModalBooking(null);
      await fetchBookings();
    } catch (e) {
      console.error(e);
      toast.error("payout transaction failed. Please try again.");
    } finally {
      setPayoutProcessing(false);
    }
  };

  // Group and sort accepted same-day bookings by locality proximity
  const getRouteSuggestions = (): Record<string, RouteStop[]> => {
    // Filter bookings that are accepted and held/pending
    const activeJobs = bookings.filter(
      (b) => b.status === "accepted" && (b.paymentStatus === "held" || b.paymentStatus === "pending")
    );

    // Group jobs by date (YYYY-MM-DD)
    const grouped: Record<string, Booking[]> = {};
    activeJobs.forEach((b) => {
      const day = b.date.split("T")[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(b);
    });

    const routeOptimization: Record<string, RouteStop[]> = {};
    const workerLocality = profile?.locality || "Baner";
    const workerCoords = getLocalityCoords(workerLocality);

    for (const [day, jobs] of Object.entries(grouped)) {
      if (jobs.length <= 1) {
        // No need for sequencing for 1 job
        routeOptimization[day] = jobs.map((b) => ({ booking: b, distanceFromPrevious: 0 }));
        continue;
      }

      // Nearest Neighbor Route Sequencer
      const stops: RouteStop[] = [];
      let currentPos = workerCoords;
      const unvisited = [...jobs];

      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const destCoords = getLocalityCoords(unvisited[i].locality || "Gokuldham");
          const dist = getDistanceKm(currentPos, destCoords);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = i;
          }
        }

        const nextJob = unvisited.splice(nearestIdx, 1)[0];
        stops.push({
          booking: nextJob,
          distanceFromPrevious: minDistance === Infinity ? 0 : minDistance,
        });
        currentPos = getLocalityCoords(nextJob.locality || "Gokuldham");
      }

      routeOptimization[day] = stops;
    }

    return routeOptimization;
  };

  const routeSequences = getRouteSuggestions();

  // Statistics calculation
  const clearedEarnings = bookings
    .filter((b) => b.paymentStatus === "released")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

  const heldEarnings = bookings
    .filter((b) => b.paymentStatus === "held")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  // Determine verification tier unlocking details
  const currentTier = profile?.verificationStatus || "unverified";
  const tierUnlocked = {
    unverified: "Verify phone number to receive job requests.",
    phone_verified: "Verify ID to get 2x more job invites & client deposits.",
    id_verified: "You have maximum trust parameters with ID verification.",
  }[currentTier] || "";

  return (
    <Layout>
      {/* Offline Status Check Bar */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white font-semibold text-xs px-4 py-2 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 animate-pulse">
              <WifiOff className="h-4 w-4" />
              Connection Interrupted. Running in Offline Mode.
            </span>
            <span>Queued Actions: {offlineQueueLength} (Will sync automatic when online)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="bg-gradient-hero py-10 lg:py-14 text-white">
        <div className="container">
          <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Avatar"
                  className="h-16 w-16 rounded-full border-2 border-white/40 object-cover shadow-brand" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-brand">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold">
                    {profile?.displayName ?? "Worker"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/80 capitalize bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    Primary: {profile?.category || "Helper"}
                  </span>

                  {/* Status Indicator */}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${isOnline
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}>
                    {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Panel */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Availability Widget */}
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10 select-none">
                <span className="text-xs font-semibold">Availability:</span>
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className="flex items-center transition hover:opacity-90"
                  title="Toggle Work Availability"
                >
                  {availability ? (
                    <span className="flex items-center gap-1 text-green-300 font-bold text-xs">
                      <ToggleRight className="h-6 w-6 text-green-400" /> Available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-white/50 font-bold text-xs">
                      <ToggleLeft className="h-6 w-6 text-white/40" /> Busy
                    </span>
                  )}
                </button>
              </div>

              <Link
                to="/profile/worker"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Profile & Skills
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Level Banner Nudges */}
      <section className="py-6 bg-muted/20 border-b border-border">
        <div className="container">
          <div className="rounded-2xl border border-indigo-150 bg-indigo-50/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <ShieldCheck className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Verification Level Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-heading font-extrabold text-indigo-950 capitalize">{currentTier.replace("_", " ")}</span>
                  <VerificationBadge status={currentTier} size="sm" />
                </div>
                <p className="text-xs text-indigo-900 mt-1 max-w-xl font-medium">
                  {tierUnlocked}
                </p>
              </div>
            </div>

            {currentTier !== "id_verified" && (
              <Link
                to="/profile/worker"
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm self-start md:self-auto shrink-0"
              >
                Complete your verification
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-2 gap-px md:grid-cols-4">
          {[
            { label: "Cleared Earnings", value: `₹${clearedEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-green-600" },
            { label: "Held in Escrow", value: `₹${heldEarnings.toLocaleString("en-IN")}`, icon: Wallet, color: "text-indigo-600" },
            { label: "Pending Requests", value: counts.pending, icon: Clock, color: "text-yellow-600" },
            { label: "Active Approved", value: counts.accepted, icon: Briefcase, color: "text-blue-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col gap-1 px-6 py-5">
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings History Section */}
      <section className="py-10 border-b border-border">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Earnings History
            </h2>
            <button className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Download className="h-4 w-4" /> Download Report
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.filter(b => b.paymentStatus === "released").length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No earnings history yet
                      </td>
                    </tr>
                  ) : (
                    bookings.filter(b => b.paymentStatus === "released").map((b) => (
                      <tr key={b.id} className="hover:bg-muted/10">
                        <td className="px-6 py-4 text-sm text-foreground">
                          {new Date(b.updatedAt || b.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground capitalize">{b.category}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{b.clientName}</td>
                        <td className="px-6 py-4 text-sm font-bold text-primary">₹{b.amount}{b.payoutFeeDeduction && ` (-₹${b.payoutFeeDeduction})`}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            {b.payoutType === "instant" ? "Instant" : "Released"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Left Jobs, Right scheduling & Demand Hints */}
      <section className="py-10">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Bookings list (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Active Job Requests
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-card rounded-2xl border border-border">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-bold text-foreground text-base">No job requests yet</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                  Job requests matching your category profile will populate here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-brand transition-all hover:shadow-card-hover hover:border-gray-300"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading font-extrabold text-foreground capitalize text-sm">{b.category}</span>
                          <StatusBadge status={b.status} />
                          <PaymentStatusBadge status={b.paymentStatus || "pending"} />
                          {b.urgent && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <Zap className="h-2.5 w-2.5 animate-pulse text-amber-600" />
                              URGENT BOOST
                            </span>
                          )}
                        </div>

                        <p className="text-sm mt-1">
                          Client: <span className="font-semibold text-foreground">{b.clientName}</span>
                        </p>

                        {b.locality && (
                          <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-3.5 w-3.5 inline text-muted-foreground" />
                            Locality: <span className="font-medium text-foreground">{b.locality}</span>
                          </p>
                        )}

                        {b.notes && (
                          <div className="text-xs text-muted-foreground/90 whitespace-pre-line bg-muted/40 rounded-xl p-3 mt-2 border border-border">
                            <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1 tracking-wider">Instructions:</p>
                            {b.notes}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground pt-1.5">
                          Scheduled: <span className="font-bold text-foreground">
                            {new Date(b.date).toLocaleDateString("en-IN", {
                              weekday: "short", day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </p>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        {b.amount && (
                          <p className="text-xl font-black text-primary font-heading">₹{b.amount}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Payout</p>
                      </div>
                    </div>

                    {/* Actions Controls Container */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3.5">
                      {/* Booking Pending Actions */}
                      {b.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            id={`btn-accept-${b.id}`}
                            onClick={() => changeStatus(b.id, "accepted")}
                            disabled={acting === b.id}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/95 disabled:opacity-50"
                          >
                            {acting === b.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Accept Job Request
                          </button>
                          <button
                            id={`btn-decline-${b.id}`}
                            onClick={() => changeStatus(b.id, "declined")}
                            disabled={acting === b.id}
                            className="flex items-center gap-1.5 rounded-xl border border-destructive px-4 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Decline Request
                          </button>
                        </div>
                      )}

                      {/* Scenario A: Accepted & Pending Escrow */}
                      {b.status === "accepted" && b.paymentStatus === "pending" && (
                        <span className="text-xs text-amber-800 font-semibold flex items-center gap-1.5 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 animate-bounce" /> Awaiting client escrow deposit before starting work.
                        </span>
                      )}

                      {/* Scenario B: Accepted & Escrow Held */}
                      {b.status === "accepted" && b.paymentStatus === "held" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-indigo-700 font-bold flex items-center gap-1.5 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200">
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 animate-pulse" /> Escrow Secure. Start Job!
                          </span>

                          <button
                            id={`btn-complete-${b.id}`}
                            onClick={() => changeStatus(b.id, "completed")}
                            disabled={acting === b.id}
                            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                          >
                            {acting === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Complete Work & Notify Client
                          </button>
                        </div>
                      )}

                      {/* Scenario C: Completed but Payout still Held in escrow (Enable "Get Paid Now" Nudge) */}
                      {b.status === "completed" && b.paymentStatus === "held" && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl p-4 gap-3">
                          <div className="flex items-start gap-2 max-w-md">
                            <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">Job Finished. Awaiting client release confirmation.</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Standard release will occur automatically within 3-5 days of customer verification (0% Fee).</p>
                            </div>
                          </div>

                          {/* Get Paid Now button */}
                          <button
                            type="button"
                            onClick={() => setPayoutModalBooking(b)}
                            className="inline-flex items-center gap-1 text-xs font-extrabold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm border border-indigo-500 shrink-0"
                          >
                            <Zap className="h-3.5 w-3.5 fill-current text-yellow-300 animate-pulse" />
                            Get Paid Now
                          </button>
                        </div>
                      )}

                      {/* Scenario D: Disputed */}
                      {b.paymentStatus === "disputed" && (
                        <span className="text-xs text-red-700 font-bold flex items-center gap-1.5 bg-red-50 px-3.5 py-2 rounded-xl border border-red-200">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Escrow locked. Dispute filed. Contact admin support.
                        </span>
                      )}

                      {/* Scenario E: Released */}
                      {b.paymentStatus === "released" && (
                        <div className="text-xs text-emerald-800 font-bold flex flex-wrap items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Payout cleared & released.</span>
                          {b.payoutType === "instant" && (
                            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-indigo-600 text-white rounded font-extrabold uppercase tracking-wide">
                              Instant Same-Day Payout
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Route Schedule & Demand Hints (4 columns) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Widget A: Route Optimizer sequencer */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-heading text-md font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-primary" /> Proximity Route Optimizer
              </h3>

              <p className="text-xs text-muted-foreground">
                Same-day multiple bookings sequenced to minimize geographic travel using nearest-neighbor proximity calculations.
              </p>

              {Object.keys(routeSequences).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground/80 bg-muted/10">
                  No accepted jobs scheduled to suggest routes.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(routeSequences).map(([day, stops]) => {
                    const hasMultiple = stops.length > 1;
                    return (
                      <div key={day} className="border border-border/80 rounded-xl p-3 bg-muted/5">
                        <p className="text-xs font-bold text-foreground border-b border-border/80 pb-1.5 mb-2.5 uppercase tracking-wider text-primary">
                          {new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}
                        </p>

                        {stops.length <= 1 ? (
                          <p className="text-xs text-muted-foreground italic">Single booking scheduled. No sequencing needed.</p>
                        ) : (
                          <div className="relative pl-4 border-l border-primary/20 space-y-4">
                            {stops.map((stop, idx) => (
                              <div key={stop.booking.id} className="relative">
                                {/* Dot Indicator */}
                                <span className="absolute -left-[21.5px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary font-heading text-[9px] font-black text-primary-foreground ring-4 ring-card">
                                  {idx + 1}
                                </span>

                                <div className="text-left leading-tight">
                                  <p className="text-xs font-bold text-foreground capitalize">{stop.booking.category} ({stop.booking.clientName})</p>
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    Locality: {stop.booking.locality || "Near Center"}
                                  </p>
                                  {idx > 0 && (
                                    <p className="text-[9px] font-bold text-indigo-600 mt-1 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block">
                                      + {stop.distanceFromPrevious} km detour from stop #{idx}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget B: Local Demand Indicators */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-heading text-md font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-primary" /> Local Skill Market Demand
              </h3>

              <p className="text-xs text-muted-foreground">
                Posting frequency aggregates for <span className="font-bold underline text-foreground">{profile?.locality || "Gokuldham"}</span> (past 30 days):
              </p>

              {demandHints.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {demandHints.map((dh) => {
                    const isTagged = profile?.categories?.includes(dh.categoryId) || profile?.category === dh.categoryId;

                    const badgeStyles = {
                      High: "bg-red-50 text-red-700 border-red-200",
                      Medium: "bg-amber-50 text-amber-700 border-amber-200",
                      Low: "bg-blue-50/60 text-blue-700 border-blue-100",
                    }[dh.level];

                    return (
                      <div key={dh.categoryId} className="flex items-center justify-between border border-border/60 rounded-xl p-2.5 hover:bg-muted/10 transition">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground capitalize">{dh.categoryLabel}</span>
                            {isTagged && (
                              <span className="text-[8px] bg-green-500 text-white font-extrabold px-1 rounded uppercase tracking-wide">
                                Tagged
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{dh.count} booking{dh.count === 1 ? "" : "s"} nearby</p>
                        </div>

                        <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${badgeStyles}`}>
                          {dh.level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-border pt-3">
                <Link
                  to="/profile/worker"
                  className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center justify-center gap-0.5"
                >
                  Adjust tagged skills in profile settings →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* INSTANT PAYOUT MODAL WIDGET */}
      <AnimatePresence>
        {payoutModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-brand text-left space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Zap className="h-6 w-6 text-indigo-600 fill-current" />
                <h3 className="font-heading text-lg font-black text-foreground">Same-Day Instant Payout</h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Release your escrow held earnings immediately. Compare the processing times and fee structures below:
              </p>

              {/* Fee Comparison Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3 bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Standard Payout</p>
                  <p className="text-sm font-black text-foreground mt-1">3 - 5 Days</p>
                  <p className="text-[10px] text-green-600 font-bold mt-1">₹0 Fees Applied</p>
                </div>
                <div className="rounded-xl border border-indigo-200 p-3 bg-indigo-50/20">
                  <p className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider">Get Paid Now</p>
                  <p className="text-sm font-black text-indigo-950 mt-1">5 Seconds</p>
                  <p className="text-[10px] text-amber-700 font-bold mt-1">5% Platform Surcharge</p>
                </div>
              </div>

              {/* Transaction breakdown */}
              <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Gross retainer:</span>
                  <span className="font-semibold text-foreground">₹{payoutModalBooking.amount}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Instant transfer fee (5%):</span>
                  <span>- ₹{Math.round((payoutModalBooking.amount || 0) * 0.05)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 font-bold text-slate-900">
                  <span>Net Payout to Bank Account:</span>
                  <span className="text-sm text-indigo-700 font-extrabold">₹{(payoutModalBooking.amount || 0) - Math.round((payoutModalBooking.amount || 0) * 0.05)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalBooking(null)}
                  disabled={payoutProcessing}
                  className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerInstantPayout}
                  disabled={payoutProcessing}
                  className="flex-1 rounded-xl bg-indigo-650 bg-indigo-650 bg-indigo-600 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 border border-indigo-550 shadow-sm"
                >
                  {payoutProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      Confirm Payout
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default WorkerDashboard;
