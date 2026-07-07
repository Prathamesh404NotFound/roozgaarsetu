import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, update, query, orderByChild, equalTo } from "firebase/database";
import {
  Briefcase, CheckCircle2, XCircle, Clock, IndianRupee,
  Loader2, User, TrendingUp,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import type { Booking, BookingStatus } from "@/types";

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  accepted:  { label: "Accepted",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
  declined:  { label: "Declined",  className: "bg-red-100 text-red-700 border-red-200" },
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

// ─── Component ──────────────────────────────────────────────────────────────

const WorkerDashboard = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    const q = query(
      ref(database, "bookings"),
      orderByChild("workerId"),
      equalTo(user.uid)
    );
    const snap = await get(q);
    if (snap.exists()) {
      const data = snap.val() as Record<string, Booking>;
      const list = Object.entries(data).map(([id, b]) => ({ ...b, id }));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setBookings(list);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Accept / Decline ───────────────────────────────────────────────────────

  const changeStatus = async (bookingId: string, status: BookingStatus) => {
    setActing(bookingId);
    try {
      await update(ref(database, `bookings/${bookingId}`), {
        status,
        updatedAt: new Date().toISOString(),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } finally {
      setActing(null);
    }
  };

  // ── Summary ────────────────────────────────────────────────────────────────

  const earnings = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

  const counts = {
    pending:   bookings.filter((b) => b.status === "pending").length,
    accepted:  bookings.filter((b) => b.status === "accepted").length,
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
              <img src={profile.photoURL} alt="Avatar"
                className="h-14 w-14 rounded-full border-2 border-white/40 object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <User className="h-7 w-7 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm text-white/70">Worker Dashboard</p>
              <h1 className="font-heading text-2xl font-bold text-white">
                {profile?.displayName ?? "Worker"}
              </h1>
            </div>
            <Link
              to="/profile/worker"
              className="ml-auto rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Edit Profile
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-2 gap-px md:grid-cols-4">
          {[
            { label: "Earnings",  value: `₹${earnings.toLocaleString("en-IN")}`, icon: IndianRupee,  color: "text-primary" },
            { label: "Pending",   value: counts.pending,                           icon: Clock,        color: "text-yellow-600" },
            { label: "Accepted",  value: counts.accepted,                          icon: Briefcase,    color: "text-blue-600" },
            { label: "Completed", value: counts.completed,                         icon: TrendingUp,   color: "text-green-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col gap-1 px-6 py-5">
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Job requests */}
      <section className="py-10 lg:py-14">
        <div className="container">
          <h2 className="mb-6 font-heading text-xl font-semibold">Job Requests</h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No job requests yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Requests from clients will appear here.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              className="space-y-3"
            >
              {bookings.map((b) => (
                <motion.div
                  key={b.id}
                  variants={{
                    hidden:   { opacity: 0, y: 12 },
                    visible:  { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-brand transition hover:shadow-card-hover sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground capitalize">{b.category}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Client: <span className="font-medium text-foreground">{b.clientName}</span>
                    </p>
                    {b.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{b.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                      {b.amount ? ` · ₹${b.amount}` : ""}
                    </p>
                  </div>

                  {/* Actions — only for pending bookings */}
                  {b.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        id={`btn-accept-${b.id}`}
                        onClick={() => changeStatus(b.id, "accepted")}
                        disabled={acting === b.id}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        {acting === b.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Accept
                      </button>
                      <button
                        id={`btn-decline-${b.id}`}
                        onClick={() => changeStatus(b.id, "declined")}
                        disabled={acting === b.id}
                        className="flex items-center gap-1.5 rounded-lg border border-destructive px-3.5 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Mark as completed */}
                  {b.status === "accepted" && (
                    <button
                      id={`btn-complete-${b.id}`}
                      onClick={() => changeStatus(b.id, "completed")}
                      disabled={acting === b.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {acting === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Mark Complete
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default WorkerDashboard;
