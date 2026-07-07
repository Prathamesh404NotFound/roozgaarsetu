import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ref, get, query, orderByChild, equalTo, update, push } from "firebase/database";
import {
  CalendarDays, Clock, CheckCircle2, Loader2, User, CreditCard,
  Lock, AlertTriangle, ShieldCheck, HelpCircle, Wallet, Heart, Star,
  Filter, Bell, Settings, TrendingUp, DollarSign, MapPin, ChevronRight
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import type { Booking, BookingStatus, PaymentStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  accepted: { label: "Approved", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700 border-red-200" },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Awaiting Pay", className: "bg-muted text-muted-foreground border-border" },
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

// ─── Component ────────────────────────────────────────────────────────────────

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedWorkers, setSavedWorkers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal payment state triggers
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [payingState, setPayingState] = useState<"idle" | "processing" | "success">("idle");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchBookings = () => {
    if (!user) return;
    const q = query(
      ref(database, "bookings"),
      orderByChild("clientId"),
      equalTo(user.uid)
    );
    get(q).then((snap) => {
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
      setLoading(false);
    });
  };

  const fetchSavedWorkers = () => {
    if (!user) return;
    get(ref(database, `users/${user.uid}/savedWorkers`)).then((snap) => {
      if (snap.exists()) {
        setSavedWorkers(Object.values(snap.val()));
      }
    });
  };

  const fetchNotifications = () => {
    if (!user) return;
    get(ref(database, `users/${user.uid}/notifications`)).then((snap) => {
      if (snap.exists()) {
        const notifs = Object.entries(snap.val()).map(([id, n]: [string, any]) => ({ id, ...n }));
        setNotifications(notifs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
    });
  };

  useEffect(() => {
    fetchBookings();
    fetchSavedWorkers();
    fetchNotifications();
  }, [user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  // Simulated checkout and escrow hold placement
  const triggerEscrowPayment = async () => {
    if (!paymentModalBooking || !user) return;

    setPayingState("processing");

    // MOCK PAYMENT GATEWAY PROCESS
    // Razorpay Standard sandbox gateway trigger.
    /*
      TODO: Replace with actual Razorpay script integration later.
      const rzpOptions = {
        key: 'rzp_test_YOUR_KEY', 
        amount: paymentModalBooking.amount * 100, // Paisa conversion
        currency: 'INR',
        name: 'RoozgaarSetu Escrow Ltd',
        handler: async (response) => { ... }
      };
      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    */

    setTimeout(async () => {
      try {
        const updates = {
          paymentStatus: "held" as PaymentStatus,
          updatedAt: new Date().toISOString(),
        };

        await update(ref(database, `bookings/${paymentModalBooking.id}`), updates);

        setPayingState("success");
        setTimeout(() => {
          setPaymentModalBooking(null);
          setPayingState("idle");
          fetchBookings();
        }, 1500);

      } catch (err) {
        console.error("Escrow hold write failed:", err);
        setPayingState("idle");
      }
    }, 2000);
  };

  // Release payment in escrow to worker
  const handleReleasePayment = async (b: Booking) => {
    if (!confirm("Are you sure you want to mark this job complete and release the funds to the worker? This action is irreversible.")) return;

    setActionLoadingId(b.id);
    try {
      const updates = {
        status: "completed" as BookingStatus,
        paymentStatus: "released" as PaymentStatus,
        updatedAt: new Date().toISOString(),
      };

      await update(ref(database, `bookings/${b.id}`), updates);
      fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dispute payment in escrow
  const handleDisputePayment = async (b: Booking) => {
    const reason = prompt("Please state the reason/dispute details for our admin team to review:");
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert("A dispute reason is required to lock escrow funds.");
      return;
    }

    setActionLoadingId(b.id);
    try {
      const updates = {
        paymentStatus: "disputed" as PaymentStatus,
        notes: `${b.notes || ""}\n[DISPUTE REASON]: ${reason.trim()}`,
        updatedAt: new Date().toISOString(),
      };

      await update(ref(database, `bookings/${b.id}`), updates);
      fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Avatar"
                className="h-14 w-14 rounded-full border-2 border-white/40 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <User className="h-7 w-7 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm text-white/70">Welcome back</p>
              <h1 className="font-heading text-2xl font-bold text-white">
                {profile?.displayName ?? "Client"}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="rounded-lg border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50"
                    >
                      <div className="border-b border-border px-4 py-3">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="border-b border-border px-4 py-3 last:border-0">
                              <p className="text-sm text-foreground">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/profile/client"
                className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Edit Profile
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-2 gap-px md:grid-cols-4">
          {[
            { label: "Total Bookings", value: counts.total, icon: CalendarDays, color: "text-primary" },
            { label: "Pending", value: counts.pending, icon: Clock, color: "text-yellow-600" },
            { label: "Accepted/Approved", value: counts.accepted, icon: ShieldCheck, color: "text-blue-600" },
            { label: "Completed", value: counts.completed, icon: CheckCircle2, color: "text-green-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col gap-1 px-6 py-5">
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bookings list */}
      <section className="py-10 lg:py-14">
        <div className="container">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-heading text-xl font-semibold">My Bookings</h2>
            <div className="flex items-center gap-3">
              {/* Filter Controls */}
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
                {["all", "pending", "accepted", "completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${filterStatus === status
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <Link
                to="/booking"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                + New Booking
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your bookings will appear here once you make one.
              </p>
              <Link
                to="/booking"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Book a Service
              </Link>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              className="space-y-4"
            >
              {bookings.filter((b) => filterStatus === "all" || b.status === filterStatus).map((b) => (
                <motion.div
                  key={b.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                  className="rounded-2xl border border-border bg-card shadow-brand transition hover:shadow-card-hover"
                >
                  <Link to={`/booking/${b.id}`} className="block p-5 pb-3">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground capitalize">{b.category}</span>
                          <StatusBadge status={b.status} />
                          <PaymentStatusBadge status={b.paymentStatus || "pending"} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Worker: <span className="font-medium text-foreground">{b.workerName}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right">
                        <p className="text-sm font-medium text-foreground">
                          {new Date(b.date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                        {b.amount && (
                          <p className="text-sm font-bold text-primary">₹{b.amount}</p>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Actions & Escrow Logic controls */}
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
                    {/* Scenario A: Booking is accepted but escrow payment has not been made */}
                    {b.status === "accepted" && b.paymentStatus === "pending" && (
                      <button
                        onClick={() => setPaymentModalBooking(b)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay Escrow hold (₹{b.amount})
                      </button>
                    )}

                    {/* Scenario B: Escrow hold is active - show completion release and dispute controls */}
                    {b.paymentStatus === "held" && (
                      <>
                        <button
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleDisputePayment(b)}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 px-4 py-2 text-xs font-semibold hover:bg-amber-100/50 disabled:opacity-50 transition"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Raise a Dispute
                        </button>
                        <button
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleReleasePayment(b)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {actionLoadingId === b.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Release Payment
                        </button>
                      </>
                    )}

                    {b.paymentStatus === "disputed" && (
                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5" /> Dispute filed. Under review by support.
                      </span>
                    )}

                    {b.status === "pending" && (
                      <span className="text-xs text-muted-foreground italic bg-muted/40 px-3 py-1.5 rounded-lg">
                        Waiting for worker to accept booking...
                      </span>
                    )}

                    <Link to={`/booking/${b.id}`} className="text-xs text-primary underline font-semibold ml-auto">
                      View details →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Saved Workers Section */}
      {savedWorkers.length > 0 && (
        <section className="py-10 lg:py-14 border-t border-border">
          <div className="container">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Saved Workers
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedWorkers.map((worker) => (
                <div key={worker.id} className="rounded-2xl border border-border bg-card p-5 shadow-brand transition hover:shadow-card-hover">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">
                      {worker.name?.split(" ").map((n: string) => n[0]).join("") || "W"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{worker.name}</h3>
                      <p className="text-sm text-muted-foreground">{worker.category || "Worker"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{worker.location || "Location"}</p>
                    </div>
                  </div>
                  <Link
                    to={`/worker/${worker.id}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View Profile <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Escrow simulated payment dialog */}
      <AnimatePresence>
        {paymentModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h3 className="font-heading text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-600" />
                Escrow Hold Deposit
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Funds are held secure by RoozgaarSetu and released to the worker only when you approve completion.
              </p>

              {payingState === "idle" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 text-sm space-y-2 text-indigo-900">
                    <div className="flex justify-between font-medium">
                      <span>Service Charge:</span>
                      <span>₹{paymentModalBooking.amount - 100}</span>
                    </div>
                    <div className="flex justify-between text-xs text-indigo-700">
                      <span>Platform Trust Guard / Escrow:</span>
                      <span>₹100</span>
                    </div>
                    <div className="border-t border-indigo-200 my-1 pt-2 flex justify-between font-bold text-base">
                      <span>Total Hold Amount:</span>
                      <span>₹{paymentModalBooking.amount}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentModalBooking(null)}
                      className="flex-1 rounded-xl border border-border py-3 text-xs font-bold hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={triggerEscrowPayment}
                      className="flex-1 rounded-xl bg-indigo-600 text-white font-bold py-3 text-xs hover:bg-indigo-700 transition"
                    >
                      Deposit & Hold Funds
                    </button>
                  </div>

                  <p className="text-[10px] text-center text-muted-foreground italic">
                    * Sandbox simulation mode active. No actual transactions will occur.
                  </p>
                </div>
              )}

              {payingState === "processing" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold">Simulating checkout payment...</p>
                  <p className="text-xs text-muted-foreground max-w-sm px-4">
                    Writing token metadata, verification checksum and locking escrow funds.
                  </p>
                </div>
              )}

              {payingState === "success" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
                  <p className="text-sm font-bold text-emerald-600">Escrow Hold Locked!</p>
                  <p className="text-xs text-muted-foreground">
                    Receipt matches reference number {paymentModalBooking.id}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default ClientDashboard;
