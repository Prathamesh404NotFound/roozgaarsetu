import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { CalendarDays, Clock, CheckCircle2, XCircle, Loader2, User } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import type { Booking, BookingStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      ref(database, "bookings"),
      orderByChild("clientId"),
      equalTo(user.uid)
    );
    get(q).then((snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, Booking>;
        const list = Object.entries(data).map(([id, b]) => ({ ...b, id }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBookings(list);
      }
      setLoading(false);
    });
  }, [user]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = {
    total:     bookings.length,
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
            <Link
              to="/profile/client"
              className="ml-auto rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Edit Profile
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-2 gap-px md:grid-cols-4">
          {[
            { label: "Total Bookings",     value: counts.total,     icon: CalendarDays, color: "text-primary" },
            { label: "Pending",            value: counts.pending,   icon: Clock,        color: "text-yellow-600" },
            { label: "Accepted",           value: counts.accepted,  icon: CheckCircle2, color: "text-blue-600" },
            { label: "Completed",          value: counts.completed, icon: CheckCircle2, color: "text-green-600" },
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">My Bookings</h2>
            <Link
              to="/booking"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              + New Booking
            </Link>
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
              className="space-y-3"
            >
              {bookings.map((b) => (
                <motion.div
                  key={b.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-brand transition hover:shadow-card-hover sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground capitalize">{b.category}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Worker: <span className="font-medium text-foreground">{b.workerName}</span>
                    </p>
                    {b.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{b.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(b.date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    {b.amount && (
                      <p className="text-sm font-semibold text-primary">₹{b.amount}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ClientDashboard;
