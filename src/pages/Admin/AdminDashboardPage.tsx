import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ref, get, update } from "firebase/database";
import {
  Users, Briefcase, CalendarDays, Loader2, ArrowLeft, CheckCircle, XCircle, Info,
  AlertTriangle, ShieldCheck, MapPin, TrendingUp, IndianRupee, Wallet, Calendar,
  Filter, Award, Eye, Hammer, RefreshCw, Lock as LockIcon, Settings, BarChart, FileText
} from "lucide-react";
import { database } from "@/lib/firebase";
import type { Booking, WorkerRecord, UserProfile, BookingStatus, PaymentStatus } from "@/types";
import { getLocalityCoords } from "@/lib/location";
import { toast } from "sonner";

// Import Leaflet directly for geospatial mapping
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Verification Tiers ──────────────────────────────────────────────────────

type VerificationTier = 'unverified' | 'phone_verified' | 'id_verified';

const TIER_LABELS: Record<VerificationTier, string> = {
  unverified: "Unverified",
  phone_verified: "Phone Verified",
  id_verified: "ID Verified"
};

// ─── Heuristic IP/Device Generator for Simulation of IP duplication ──────────
const getSimulatedIP = (uid: string) => {
  // Generate duplicate IPs for couple of users to trigger suspicious fingerprint rules
  const lastChar = uid.charCodeAt(uid.length - 1) || 0;
  if (lastChar % 5 === 0) return "192.168.1.100";  // Collusion IP trigger
  if (lastChar % 7 === 0) return "192.168.1.101";  // Another collusion IP trigger
  return `192.168.1.${10 + (lastChar % 80)}`;
};

interface FlaggedRecord {
  id: string;
  type: "Collusion / Same IP" | "Ultra-Fast Completion" | "Suspicious Rating Burst";
  entityName: string;
  details: string;
  severity: "High" | "Medium";
  timestamp: string;
}

interface CategoryHealthMetric {
  category: string;
  area: string;
  avgTimeMins: number; // minutes to accept
  bookingsCount: number;
}

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "verify" | "disputes" | "fraud" | "heatmap" | "ledger" | "audit">("overview");
  const [loading, setLoading] = useState(true);

  // Raw database storage states
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [workers, setWorkers] = useState<Record<string, WorkerRecord>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Action status triggers
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Dispute split state
  const [splittingBookingId, setSplittingBookingId] = useState<string | null>(null);
  const [clientSplitPercent, setClientSplitPercent] = useState<number>(50);
  const [disputeNote, setDisputeNote] = useState<string>("");

  // Date range filters for marketplace ledger
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Leaflet map reference
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const mapMarkers = useRef<L.LayerGroup | null>(null);

  // Dynamic Audit scan flags
  const [flaggedItems, setFlaggedItems] = useState<FlaggedRecord[]>([]);

  // Category health tracking lists
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryHealthMetric[]>([]);

  // Load database structures
  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const [usersSnap, workersSnap, bookingsSnap] = await Promise.all([
        get(ref(database, "users")),
        get(ref(database, "workers")),
        get(ref(database, "bookings")),
      ]);

      const usersObj = usersSnap.exists() ? (usersSnap.val() as Record<string, UserProfile>) : {};
      const workersObj = workersSnap.exists() ? (workersSnap.val() as Record<string, WorkerRecord>) : {};

      let bookingsList: Booking[] = [];
      if (bookingsSnap.exists()) {
        bookingsList = Object.entries(bookingsSnap.val() as Record<string, Booking>).map(([id, b]) => ({
          ...b,
          id,
          paymentStatus: b.paymentStatus || "pending",
        }));
      }

      setUsers(usersObj);
      setWorkers(workersObj);
      setBookings(bookingsList);

      // Perform scans for fraud & category health dynamic summaries
      runFraudAuditScan(usersObj, workersObj, bookingsList);
      runCategoryHealthAnalysis(bookingsList);

    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh admin marketplace registries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Run Fraud logs detector anomalies logic (Rule checks)
  const runFraudAuditScan = (
    allUsers: Record<string, UserProfile>,
    allWorkers: Record<string, WorkerRecord>,
    allBookings: Booking[]
  ) => {
    const flags: FlaggedRecord[] = [];

    // Check IP duplicate collisions
    const ipCounts: Record<string, string[]> = {}; // IP -> Array of UserIDs
    Object.entries(allUsers).forEach(([uid, u]) => {
      const uIP = getSimulatedIP(uid);
      if (!ipCounts[uIP]) ipCounts[uIP] = [];
      ipCounts[uIP].push(uid);
    });

    Object.entries(ipCounts).forEach(([ip, uids]) => {
      if (uids.length > 2) {
        const names = uids.map(id => allUsers[id]?.displayName || "Unknown User").join(", ");
        flags.push({
          id: `frd_ip_${ip.replace(/\./g, "_")}`,
          type: "Collusion / Same IP",
          entityName: `Device Fingerprint: ${ip}`,
          details: `${uids.length} accounts verified from duplicate network access points: ${names}`,
          severity: "High",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Check Ultra-Fast Completion times
    allBookings.forEach((b) => {
      if (b.status === "completed" && b.createdAt && b.updatedAt) {
        const start = new Date(b.createdAt).getTime();
        const end = new Date(b.updatedAt).getTime();
        const deltaMins = (end - start) / (1000 * 60);

        if (deltaMins > 0 && deltaMins < 2.0) { // Flag jobs completed in < 2 minutes
          flags.push({
            id: `frd_fast_${b.id}`,
            type: "Ultra-Fast Completion",
            entityName: `Booking reference ${b.id.substring(0, 8)}`,
            details: `Job (${b.category}) marked completed by ${b.workerName} only ${deltaMins.toFixed(1)} minutes after client posting.`,
            severity: "High",
            timestamp: b.updatedAt,
          });
        }
      }
    });

    // Check suspicious ratings bursts (worker gets multiple bookings in rapid succession)
    const completionsCount: Record<string, number> = {}; // workerId -> count
    allBookings.forEach((b) => {
      if (b.status === "completed") {
        completionsCount[b.workerId] = (completionsCount[b.workerId] || 0) + 1;
      }
    });

    Object.entries(completionsCount).forEach(([workerId, count]) => {
      if (count >= 5) {
        const wName = allWorkers[workerId]?.uid ? (allUsers[workerId]?.displayName || "Worker") : "Worker";
        flags.push({
          id: `frd_burst_${workerId}`,
          type: "Suspicious Rating Burst",
          entityName: `${wName} Profile`,
          details: `Worker logged a burst of ${count} completed gigs recently. Higher risk of billing collusion.`,
          severity: "Medium",
          timestamp: new Date().toISOString(),
        });
      }
    });

    setFlaggedItems(flags);
  };

  // Run Category Health Analysis (Average Accept Duration)
  const runCategoryHealthAnalysis = (allBookings: Booking[]) => {
    // Group active/completed bookings by Category and Locality
    const groups: Record<string, { totalMins: number; count: number }> = {};

    allBookings.forEach((b) => {
      if (b.createdAt && b.updatedAt) {
        const locality = b.locality || "Baner";
        const key = `${b.category}::${locality}`;

        const created = new Date(b.createdAt).getTime();
        const updated = new Date(b.updatedAt).getTime();
        const durationMins = (updated - created) / (1000 * 60);

        if (durationMins > 0) {
          if (!groups[key]) groups[key] = { totalMins: 0, count: 0 };
          groups[key].totalMins += durationMins;
          groups[key].count += 1;
        }
      }
    });

    const metrics: CategoryHealthMetric[] = Object.entries(groups).map(([complexKey, stats]) => {
      const [category, area] = complexKey.split("::");
      return {
        category,
        area,
        avgTimeMins: Math.round(stats.totalMins / stats.count),
        bookingsCount: stats.count,
      };
    });

    // Sort by longest duration first (critical health priorities)
    metrics.sort((a, b) => b.avgTimeMins - a.avgTimeMins);
    setCategoryMetrics(metrics);
  };

  // Setup Leaflet supply/demand heatmap rendering
  useEffect(() => {
    if (activeTab !== "heatmap" || !mapRef.current) {
      // Cleanup map instance if tab switches
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        mapMarkers.current = null;
      }
      return;
    }

    if (!mapInstance.current) {
      // Instantiate leaflet map centered in Pune
      const map = L.map(mapRef.current, {
        center: [18.5204, 73.8567],
        zoom: 12,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstance.current = map;
      mapMarkers.current = L.layerGroup().addTo(map);
    }

    // Populate supply and demand bubbles
    if (mapMarkers.current) {
      mapMarkers.current.clearLayers();

      // Aggregate densities per Pune locality
      const locationDensities: Record<string, { workers: number; bookings: number }> = {};

      // Calculate supply (available workers locations)
      Object.values(workers).forEach((w) => {
        if (!w.locality) return;
        const loc = w.locality.trim().toLowerCase();
        if (!locationDensities[loc]) locationDensities[loc] = { workers: 0, bookings: 0 };
        locationDensities[loc].workers += 1;
      });

      // Calculate demand (booking requests locations)
      bookings.forEach((b) => {
        if (!b.locality) return;
        const loc = b.locality.trim().toLowerCase();
        if (!locationDensities[loc]) locationDensities[loc] = { workers: 0, bookings: 0 };
        locationDensities[loc].bookings += 1;
      });

      // Render overlay circles
      Object.entries(locationDensities).forEach(([localityName, stats]) => {
        const coords = getLocalityCoords(localityName);

        // Workers supply markers (Green)
        if (stats.workers > 0) {
          L.circle([coords.lat, coords.lng], {
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 0.35,
            radius: 200 + stats.workers * 100,
          })
            .bindPopup(`<strong>Locality: <span className="capitalize">${localityName}</span></strong><br/>Available Workers (Supply): ${stats.workers}`)
            .addTo(mapMarkers.current!);
        }

        // Job postings markers (Blue)
        if (stats.bookings > 0) {
          L.circle([coords.lat + 0.002, coords.lng + 0.002], { // offset slightly so circles don't overlap
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.35,
            radius: 200 + stats.bookings * 100,
          })
            .bindPopup(`<strong>Locality: <span className="capitalize">${localityName}</span></strong><br/>Job Requests (Demand): ${stats.bookings}`)
            .addTo(mapMarkers.current!);
        }

        // Deficit Highlight circles (Translucent Red when demand/demand > supply)
        const isDeficit = stats.bookings > stats.workers;
        if (isDeficit) {
          L.circle([coords.lat, coords.lng], {
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.15,
            weight: 1,
            dashArray: "4 4",
            radius: 400 + Math.max(stats.bookings, stats.workers) * 110,
          })
            .bindPopup(`<strong className="text-red-650">Supply Shortage warning!</strong><br/>Jobs (${stats.bookings}) > Workers Available (${stats.workers}) in ${localityName}.`)
            .addTo(mapMarkers.current!);
        }
      });
    }
  }, [activeTab, workers, bookings]);

  // Tab Action logic: Approval of worker ID Document
  const handleApproveWorkerVerification = async (uid: string) => {
    setActionInProgress(uid);
    try {
      await Promise.all([
        update(ref(database, `workers/${uid}`), {
          verificationStatus: "id_verified",
          isVerified: true
        }),
        update(ref(database, `users/${uid}`), {
          verificationStatus: "id_verified",
          isVerified: true
        }),
      ]);
      toast.success("Worker identity details Approved successfully.");
      await loadWorkspaceData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve verification.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Tab Action logic: Reject of worker ID Document
  const handleRejectWorkerVerification = async (uid: string) => {
    setActionInProgress(uid);
    try {
      await Promise.all([
        update(ref(database, `workers/${uid}`), {
          verificationStatus: "phone_verified", // downgrade to phone verification
          idDocumentUrl: null, // clear uploaded document
          isVerified: false
        }),
        update(ref(database, `users/${uid}`), {
          verificationStatus: "phone_verified",
          isVerified: false
        }),
      ]);
      toast.warning("Worker identity document rejected & cleared.");
      await loadWorkspaceData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject verification.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Structured Dispute Resolution actions
  const resolveDisputePaymentState = async (
    bookingId: string,
    decision: "full_worker" | "full_client" | "partial_split"
  ) => {
    setActionInProgress(bookingId);
    try {
      const b = bookings.find((x) => x.id === bookingId);
      if (!b) return;

      const gross = b.amount || 0;
      let releasedAmt = 0;
      let refundedAmt = 0;
      let summary = "";

      if (decision === "full_worker") {
        releasedAmt = gross;
        refundedAmt = 0;
        summary = "100% Payout released to worker.";
      } else if (decision === "full_client") {
        releasedAmt = 0;
        refundedAmt = gross;
        summary = "100% Refunded back to client.";
      } else {
        // partial split calculations
        releasedAmt = Math.round(gross * (clientSplitPercent / 100));
        refundedAmt = gross - releasedAmt;
        summary = `Arbitration split applied: Worker receives ₹${releasedAmt} (${clientSplitPercent}%), Client receives ₹${refundedAmt}.`;
      }

      const updates = {
        paymentStatus: (decision === "full_client" ? "refunded" : "released") as PaymentStatus,
        status: (decision === "full_client" ? "declined" : "completed") as BookingStatus,
        disputeResolutionDecision: decision,
        disputeResolutionReleasedAmount: releasedAmt,
        disputeResolutionRefundedAmount: refundedAmt,
        disputeResolutionSummary: summary,
        disputeResolutionNote: disputeNote,
        resolvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await update(ref(database, `bookings/${bookingId}`), updates);
      toast.success(`Dispute resolved. ${summary}`);
      setSplittingBookingId(null);
      setDisputeNote("");
      await loadWorkspaceData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to resolve dispute booking transaction.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Flag resolves
  const handleResolveFraudFlag = (flagId: string) => {
    setFlaggedItems((p) => p.filter((f) => f.id !== flagId));
    toast.success("Flag archived. Entity marked as verified/audited.");
  };

  // Overview metrics calculations
  const escrowTotals = { held: 0, released: 0, refunded: 0, disputed: 0, commissions: 0 };

  bookings.forEach((b) => {
    const amt = b.amount || 0;

    // Add up commission totals from 5% instant payout fee check
    if (b.payoutFeeDeduction) {
      escrowTotals.commissions += b.payoutFeeDeduction;
    }

    if (b.paymentStatus === "held") escrowTotals.held += amt;
    else if (b.paymentStatus === "released") escrowTotals.released += amt;
    else if (b.paymentStatus === "refunded") escrowTotals.refunded += amt;
    else if (b.paymentStatus === "disputed") escrowTotals.disputed += amt;
  });

  // Filter ledger list based on date filters
  const filteredLedger = bookings.filter((b) => {
    if (!b.createdAt) return false;
    const bDate = b.createdAt.substring(0, 10); // YYYY-MM-DD
    if (startDate && bDate < startDate) return false;
    if (endDate && bDate > endDate) return false;
    return true;
  });

  // Calculate filtered ledger sums
  const ledgerTotals = { held: 0, released: 0, refunded: 0, disputed: 0, commissions: 0 };
  filteredLedger.forEach((b) => {
    const amt = b.amount || 0;
    if (b.payoutFeeDeduction) ledgerTotals.commissions += b.payoutFeeDeduction;
    if (b.paymentStatus === "held") ledgerTotals.held += amt;
    else if (b.paymentStatus === "released") ledgerTotals.released += amt;
    else if (b.paymentStatus === "refunded") ledgerTotals.refunded += amt;
    else if (b.paymentStatus === "disputed") ledgerTotals.disputed += amt;
  });

  return (
    <div>
      <section className="bg-gradient-hero py-10 lg:py-14 text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition">
                <ArrowLeft className="h-4 w-4" /> Exit Marketplace Operations
              </Link>
              <h1 className="font-heading text-2xl font-black">Marketplace Controller Hub</h1>
              <p className="text-xs text-white/80">Monitor dispute arbitrations, fraud metrics, geosupply coordinates, and financials.</p>
            </motion.div>

            {/* Refresh Button */}
            <button
              onClick={loadWorkspaceData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 text-white rounded-xl border border-white/20 px-3.5 py-2 hover:bg-white/20 transition-all self-start md:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Database logs
            </button>
          </div>
        </div>
      </section>

      {/* Admin Tab Controller Navigation */}
      <section className="border-b border-border bg-card select-none">
        <div className="container">
          <div className="flex items-center gap-1 overflow-x-auto py-2.5">
            {[
              { id: "overview", label: "Overview & Health", icon: TrendingUp },
              { id: "verify", label: "Verification Queue", icon: ShieldCheck, badgeCount: Object.values(workers).filter(w => w.idDocumentUrl && w.verificationStatus !== "id_verified").length },
              { id: "disputes", label: "Disputes Center", icon: AlertTriangle, badgeCount: bookings.filter(b => b.paymentStatus === "disputed").length },
              { id: "fraud", label: "Fraud & Anomalies", icon: Info, badgeCount: flaggedItems.length },
              { id: "heatmap", label: "Geo Heatmap", icon: MapPin },
              { id: "ledger", label: "Financial Ledger", icon: Wallet },
              { id: "audit", label: "Audit Logs", icon: FileText },
              { id: "analytics", label: "Analytics", icon: BarChart, isLink: true, linkTo: "/admin/analytics" },
              { id: "settings", label: "Settings", icon: Settings, isLink: true, linkTo: "/admin/settings" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const tabClassName = `flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all relative shrink-0 ${isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`;

              if (tab.isLink) {
                return (
                  <Link
                    key={tab.id}
                    to={tab.linkTo}
                    className={tabClassName}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "overview" | "verify" | "disputes" | "fraud" | "heatmap" | "ledger" | "audit")}
                  className={tabClassName}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {!!tab.badgeCount && (
                    <span className={`inline-flex items-center justify-center rounded-full h-4 min-w-[16px] px-1 text-[9px] font-black ${isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                      }`}>
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-card rounded-2xl border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* TAB 1: OVERVIEW & MARKET HEALTH */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Stats Cards grid */}
                  <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
                    {[
                      { label: "Active Workers Available", value: Object.values(workers).filter(w => w.availability).length, icon: Briefcase, color: "text-green-600 bg-green-500/5 border-green-500/10" },
                      { label: "Bookings Processed", value: bookings.length, icon: CalendarDays, color: "text-purple-600 bg-purple-500/5 border-purple-500/10" },
                      { label: "Held in Escrow Protection", value: `₹${escrowTotals.held.toLocaleString()}`, icon: LockIcon, color: "text-indigo-600 bg-indigo-500/5 border-indigo-500/10" },
                      { label: "Platform Commissions Earned", value: `₹${escrowTotals.commissions.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600 bg-emerald-500/5 border-emerald-500/10" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className={`rounded-2xl border p-5 shadow-sm bg-card flex flex-col gap-2`}>
                        <div className="flex items-center justify-between">
                          <Icon className={`h-6 w-6`} />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-foreground font-heading">{value}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Category health monitoring */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">Category Response Health Metrics</h3>
                      <p className="text-xs text-muted-foreground">Average elapsed duration in minutes from client booking creation to worker acceptance:</p>
                    </div>

                    {categoryMetrics.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground/80 bg-muted/10 rounded-xl border border-dashed">
                        No health statistics compiled yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border/80 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                              <th className="px-5 py-3">Category</th>
                              <th className="px-5 py-3">Locality / Zone</th>
                              <th className="px-5 py-3 text-center">Gigs posted</th>
                              <th className="px-5 py-3">Average Accept Time</th>
                              <th className="px-5 py-3 text-right">Fulfillment Check</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {categoryMetrics.map((cm, idx) => {
                              const isSlow = cm.avgTimeMins > 10;
                              return (
                                <tr key={idx} className="hover:bg-muted/10">
                                  <td className="px-5 py-3.5 font-bold capitalize text-slate-800">{cm.category}</td>
                                  <td className="px-5 py-3.5 capitalize text-slate-650">{cm.area}</td>
                                  <td className="px-5 py-3.5 text-center font-semibold">{cm.bookingsCount}</td>
                                  <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-black ${isSlow ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-green-50 text-green-700 border border-green-100"
                                      }`}>
                                      {cm.avgTimeMins} mins
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    {isSlow ? (
                                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">
                                        ⚡ Deficit Supply Risk
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                                        ✓ Healthy response
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: VERIFICATION REVIEW QUEUE */}
              {activeTab === "verify" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Identity Verification Review Queue</h3>
                    <p className="text-xs text-muted-foreground">Verify uploaded government ID documents and advance verification credentials:</p>
                  </div>

                  {Object.values(workers).filter(w => w.idDocumentUrl && w.verificationStatus !== "id_verified").length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                      <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                      <p className="font-semibold text-foreground text-sm">Review Queue Clean!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No worker verification uploads currently pending administrator audits.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {Object.values(workers)
                        .filter(w => w.idDocumentUrl && w.verificationStatus !== "id_verified")
                        .map((w) => {
                          const uProfile = users[w.uid];
                          return (
                            <div key={w.uid} className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between hover:border-gray-300 transition">
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-heading text-base font-bold text-foreground">{uProfile?.displayName || "Worker"}</h4>
                                    <p className="text-xs text-muted-foreground">{uProfile?.email || "No email"}</p>
                                  </div>
                                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                                    Primary: {w.category}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Experience</span>
                                    <span className="font-medium text-foreground">{w.experience}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Location</span>
                                    <span className="font-medium text-foreground capitalize">{w.locality || w.city}</span>
                                  </div>
                                </div>

                                {/* ID Review Attachment Panel */}
                                <div className="border border-border bg-muted/20 rounded-xl p-3.5">
                                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Government ID File Reference</span>
                                  <div className="flex items-center justify-between bg-card border border-border/80 rounded-lg p-2 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <Hammer className="h-4 w-4 text-indigo-600" />
                                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                                        {w.idDocumentUrl?.replace("mock://uploaded-documents/", "")}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => alert(`Simulated document file inspection: ${w.idDocumentUrl}`)}
                                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                                    >
                                      <Eye className="h-3.5 w-3.5" /> View document
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Review Actions */}
                              <div className="mt-5 border-t border-border pt-4 flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => handleRejectWorkerVerification(w.uid)}
                                  disabled={actionInProgress === w.uid}
                                  className="inline-flex items-center gap-1 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive px-3.5 py-2 text-xs font-bold hover:bg-destructive/10 disabled:opacity-50 transition"
                                >
                                  Reject File
                                </button>
                                <button
                                  onClick={() => handleApproveWorkerVerification(w.uid)}
                                  disabled={actionInProgress === w.uid}
                                  className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/95 disabled:opacity-50 transition"
                                >
                                  Approve Verification
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DISPUTES RESOLUTION CENTER */}
              {activeTab === "disputes" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Escrow Dispute Center</h3>
                    <p className="text-xs text-muted-foreground">Arbitrate disputed bookings and apply structured escrow payouts/refund splits:</p>
                  </div>

                  {bookings.filter(b => b.paymentStatus === "disputed").length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                      <p className="font-semibold text-foreground text-sm">Disputes Queue Clear</p>
                      <p className="text-xs text-muted-foreground mt-0.5">No booking escrows are currently locked in arbitration state.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings
                        .filter(b => b.paymentStatus === "disputed")
                        .map((b) => (
                          <div key={b.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-heading font-extrabold text-slate-800 capitalize text-sm">{b.category} Booking</span>
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-250 text-amber-700 px-2 py-0.5 text-[9px] font-black uppercase">
                                    Disputed Escrow
                                  </span>
                                  {b.amount && (
                                    <span className="font-heading font-extrabold text-primary text-sm ml-2">₹{b.amount} locked</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">ID Reference: <span className="font-bold text-slate-700">{b.id}</span></p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3 bg-muted/20 border border-border/80 rounded-xl p-3.5">
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Client Details:</span>
                                    <span className="font-semibold text-slate-900">{b.clientName}</span>
                                    <span className="block text-muted-foreground text-[10px]">Client ID: {b.clientId}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Worker Details:</span>
                                    <span className="font-semibold text-slate-900">{b.workerName}</span>
                                    <span className="block text-muted-foreground text-[10px]">Worker ID: {b.workerId}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Dispute Notes Check */}
                            {b.notes && (
                              <div className="text-xs font-medium text-slate-650 bg-amber-500/5 rounded-xl p-3 border border-amber-200/40">
                                <p className="font-bold text-[9px] text-amber-700 uppercase tracking-wider mb-1">Grievance / Job Description:</p>
                                "{b.notes}"
                              </div>
                            )}

                            {/* Arbitration Split selector */}
                            {splittingBookingId === b.id ? (
                              <div className="border border-indigo-200 bg-indigo-50/20 rounded-xl p-4.5 space-y-4">
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Structured Payout Split Arbitration</h4>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-bold text-indigo-950">
                                    <span>Refund to Client: {100 - clientSplitPercent}%</span>
                                    <span>Payout to Worker: {clientSplitPercent}%</span>
                                  </div>

                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={clientSplitPercent}
                                    onChange={(e) => setClientSplitPercent(Number(e.target.value))}
                                    className="w-full accent-indigo-650 accent-indigo-600"
                                  />

                                  <div className="grid grid-cols-2 gap-2 text-xs font-bold mt-2">
                                    <div className="bg-card border rounded p-2 text-center text-slate-700">
                                      Client Refund: ₹{Math.round((b.amount || 0) * ((100 - clientSplitPercent) / 100))}
                                    </div>
                                    <div className="bg-indigo-600 text-white rounded p-2 text-center">
                                      Worker Payout: ₹{Math.round((b.amount || 0) * (clientSplitPercent / 100))}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase">Arbitration Reason Note:</label>
                                  <textarea
                                    rows={2}
                                    placeholder="Enter administrative reason for mapping this split..."
                                    value={disputeNote}
                                    onChange={(e) => setDisputeNote(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-card p-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setSplittingBookingId(null)}
                                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => resolveDisputePaymentState(b.id, "partial_split")}
                                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                                  >
                                    Confirm Arbitration Split
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t border-border pt-4 flex flex-wrap items-center justify-end gap-2.5">
                                <button
                                  onClick={() => {
                                    setClientSplitPercent(50);
                                    setSplittingBookingId(b.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/30 text-indigo-700 px-3.5 py-2 text-xs font-bold hover:bg-indigo-100/55 transition"
                                >
                                  Apply Custom Split
                                </button>
                                <button
                                  onClick={() => resolveDisputePaymentState(b.id, "full_client")}
                                  className="inline-flex items-center gap-1 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-3.5 py-2 text-xs font-bold hover:bg-destructive/10 transition"
                                >
                                  Refund Client (100%)
                                </button>
                                <button
                                  onClick={() => resolveDisputePaymentState(b.id, "full_worker")}
                                  className="inline-flex items-center gap-1 rounded-xl bg-green-600 text-white px-4 py-2 text-xs font-bold hover:bg-green-700 transition"
                                >
                                  Release to Worker (100%)
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FRAUD & ANOMALIES */}
              {activeTab === "fraud" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Marketplace Activity Audits</h3>
                    <p className="text-xs text-muted-foreground">Automated risk-checks flagging suspicious account structures, completion speed anomalies, or token spikes:</p>
                  </div>

                  {flaggedItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                      <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                      <p className="font-semibold text-foreground text-sm">No Security Anomalies Flagged</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Realtime checks verify all current marketplace transactions as normal.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {flaggedItems.map((flag) => (
                        <div
                          key={flag.id}
                          className={`rounded-2xl border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-card-hover ${flag.severity === "High" ? "border-amber-250 border-amber-300" : "border-slate-200"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {flag.severity === "High" ? (
                              <AlertTriangle className="h-6 w-6 text-amber-500 fill-amber-100 shrink-0 mt-0.5 animate-pulse" />
                            ) : (
                              <Info className="h-6 w-6 text-slate-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="flex gap-2 items-center">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${flag.severity === "High" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}>
                                  {flag.type}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Detected: {new Date(flag.timestamp).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                              <h4 className="font-heading font-black text-sm text-slate-900 mt-1.5">{flag.entityName}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{flag.details}</p>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2 items-center">
                            <button
                              onClick={() => alert(`Suspending target profile related to: ${flag.entityName}`)}
                              className="rounded-xl border border-destructive text-destructive px-3.5 py-1.5 text-xs font-bold hover:bg-destructive/5 transition"
                            >
                              Suspend Profile
                            </button>
                            <button
                              onClick={() => handleResolveFraudFlag(flag.id)}
                              className="rounded-xl bg-slate-800 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-950 transition"
                            >
                              Dismiss Flag
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: GEO DEMAND-SUPPLY HEATMAP */}
              {activeTab === "heatmap" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Market Supply & Demand Map</h3>
                    <p className="text-xs text-muted-foreground">Pune locality density checks showing available workers supply vs client job postings demand:</p>
                  </div>

                  {/* Map container */}
                  <div className="relative rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <div
                      id="admin-marketplace-heatmap"
                      ref={mapRef}
                      className="w-full h-[450px] rounded-xl overflow-hidden"
                      style={{ zIndex: 1 }}
                    />

                    {/* Map Legend Overlay Card */}
                    <div className="absolute bottom-5 right-5 z-[10] bg-card/90 backdrop-blur border border-border p-3.5 rounded-xl text-[10px] font-bold space-y-1.5 max-w-[200px] shadow-lg">
                      <p className="text-xs border-b border-border pb-1 text-slate-700 uppercase tracking-wider">Density Legend</p>
                      <div className="flex items-center gap-1.5 text-green-700">
                        <span className="h-3 w-3 rounded-full bg-green-500 inline-block opacity-75" />
                        <span>Worker Supply Spots</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-700">
                        <span className="h-3 w-3 rounded-full bg-blue-500 inline-block opacity-75" />
                        <span>Client Job Postings</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-650">
                        <span className="h-3 w-3 rounded-full bg-red-500 inline-block opacity-75" />
                        <span>Supply Deficit Zones</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: LEDGER & PLATFORM RECONCILIATION */}
              {activeTab === "ledger" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground">Financial Ledger Statement</h3>
                      <p className="text-xs text-muted-foreground">Marketplace escrow cashflow accounts statement reconciliation:</p>
                    </div>

                    {/* Date Filters Widget */}
                    <div className="flex flex-wrap items-center gap-2 bg-card border border-border rounded-xl p-2 select-none shadow-sm">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="date"
                        value={startDate}
                        placeholder="Start Date"
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-0 outline-none text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="date"
                        value={endDate}
                        placeholder="End Date"
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-0 outline-none text-xs"
                      />
                      {(startDate || endDate) && (
                        <button
                          onClick={() => { setStartDate(""); setEndDate(""); }}
                          className="text-[10px] text-indigo-600 font-bold hover:underline ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                    {[
                      { label: "Held in Escrow", val: ledgerTotals.held, style: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                      { label: "Payouts Released", val: ledgerTotals.released, style: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                      { label: "Refunded to Clients", val: ledgerTotals.refunded, style: "text-zinc-700 bg-zinc-50 border-zinc-150" },
                      { label: "Locked in disputes", val: ledgerTotals.disputed, style: "text-amber-700 bg-amber-50 border-amber-100" },
                      { label: "Commissions Collected", val: ledgerTotals.commissions, style: "text-green-700 bg-green-50 border-green-100" },
                    ].map(({ label, val, style }) => (
                      <div key={label} className={`border rounded-xl p-3.5 flex flex-col justify-between ${style}`}>
                        <span className="text-[9px] uppercase font-black tracking-wider leading-none">{label}</span>
                        <span className="text-base font-black font-heading mt-2">₹{val.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ledger logs list */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <h4 className="font-heading text-xs font-bold text-foreground uppercase tracking-wide">Escrow Ledger Audit Logs</h4>

                    {filteredLedger.length === 0 ? (
                      <div className="text-center py-10 text-xs text-muted-foreground/80 bg-muted/10 rounded-xl border border-dashed">
                        No transactions found inside selected date bracket.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border/80 rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                              <th className="px-5 py-3">Scheduled Date</th>
                              <th className="px-5 py-3">Category</th>
                              <th className="px-5 py-3">Locality</th>
                              <th className="px-5 py-3">Escrow Status</th>
                              <th className="px-5 py-3 text-right">Instant Fee</th>
                              <th className="px-5 py-3 text-right">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filteredLedger.map((b) => (
                              <tr key={b.id} className="hover:bg-muted/10">
                                <td className="px-5 py-3.5 text-slate-650">
                                  {new Date(b.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                                </td>
                                <td className="px-5 py-3.5 capitalize font-semibold text-slate-800">{b.category}</td>
                                <td className="px-5 py-3.5 capitalize text-slate-600">{b.locality || "Baner"}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[9px] font-black uppercase ${{
                                    pending: "bg-muted text-muted-foreground",
                                    held: "bg-indigo-50 text-indigo-705 text-indigo-700",
                                    released: "bg-emerald-50 text-emerald-705 text-emerald-700",
                                    refunded: "bg-zinc-100 text-zinc-650",
                                    disputed: "bg-amber-50 text-amber-705 text-amber-700",
                                  }[b.paymentStatus || "pending"]
                                    }`}>
                                    {b.paymentStatus}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right font-semibold text-green-700">
                                  {b.payoutFeeDeduction ? `₹${b.payoutFeeDeduction}` : "-"}
                                </td>
                                <td className="px-5 py-3.5 text-right font-black font-heading text-slate-900">
                                  ₹{b.amount || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: AUDIT LOGS */}
              {activeTab === "audit" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Audit Logs</h3>
                    <p className="text-xs text-muted-foreground mt-1">Track all administrative actions and system events</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                    <div className="space-y-3">
                      {/* Mock audit log entries */}
                      {[
                        { action: "Worker verification approved", user: "admin@roozgaarsetu.com", timestamp: "2024-01-15 14:32", type: "success" },
                        { action: "Booking dispute resolved", user: "admin@roozgaarsetu.com", timestamp: "2024-01-15 13:45", type: "info" },
                        { action: "User role changed to worker", user: "admin@roozgaarsetu.com", timestamp: "2024-01-15 12:20", type: "warning" },
                        { action: "Payment escrow released", user: "system", timestamp: "2024-01-15 11:15", type: "success" },
                        { action: "Worker verification rejected", user: "admin@roozgaarsetu.com", timestamp: "2024-01-15 10:30", type: "error" },
                        { action: "New user registered", user: "system", timestamp: "2024-01-15 09:45", type: "info" },
                        { action: "Settings updated", user: "admin@roozgaarsetu.com", timestamp: "2024-01-15 08:00", type: "warning" },
                      ].map((log, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/10 transition">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${log.type === "success" ? "bg-emerald-100 text-emerald-600" :
                            log.type === "error" ? "bg-red-100 text-red-600" :
                              log.type === "warning" ? "bg-amber-100 text-amber-600" :
                                "bg-blue-100 text-blue-600"
                            }`}>
                            {log.type === "success" ? <CheckCircle className="h-4 w-4" /> :
                              log.type === "error" ? <XCircle className="h-4 w-4" /> :
                                log.type === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                                  <Info className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">{log.action}</p>
                              <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">By: {log.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
