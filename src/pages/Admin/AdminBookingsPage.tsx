import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, update } from "firebase/database";
import {
  ArrowLeft, Loader2, Calendar, ClipboardList, Lock,
  AlertTriangle, CheckCircle, RotateCcw, ShieldCheck
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { database } from "@/lib/firebase";
import type { Booking, BookingStatus, PaymentStatus } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  accepted:  { label: "Accepted",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  declined:  { label: "Declined",  className: "bg-red-50 text-red-700 border-red-200" },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  pending:   { label: "No Deposit", className: "bg-muted text-muted-foreground border-border" },
  held:      { label: "Escrow Held", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  released:  { label: "Released",    className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  refunded:  { label: "Refunded",    className: "bg-zinc-100 text-zinc-650 border-zinc-200" },
  disputed:  { label: "Disputed",    className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className || ""}`}>
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

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const snap = await get(ref(database, "bookings"));
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, b]: [string, any]) => ({
          ...b,
          id,
          paymentStatus: b.paymentStatus || "pending",
        })) as Booking[];
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBookings(list);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const changeStatus = async (id: string, status: BookingStatus) => {
    setActingId(id);
    try {
      await update(ref(database, `bookings/${id}`), {
        status,
        updatedAt: new Date().toISOString(),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch (err) {
      console.error("Failed to update booking:", err);
    } finally {
      setActingId(null);
    }
  };

  // Escrow resolution: payout release direct override
  const handleAdminReleaseDispute = async (id: string) => {
    if (!confirm("Are you sure you want to resolve this dispute by releasing the escrow funds to the worker?")) return;
    setActingId(id);
    try {
      const updates = {
        status: "completed" as BookingStatus,
        paymentStatus: "released" as PaymentStatus,
        updatedAt: new Date().toISOString(),
      };
      await update(ref(database, `bookings/${id}`), updates);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "completed", paymentStatus: "released" } : b))
      );
    } catch (err) {
      console.error("Failed to resolve dispute (release):", err);
    } finally {
      setActingId(null);
    }
  };

  // Escrow resolution: refund direct override
  const handleAdminRefundDispute = async (id: string) => {
    if (!confirm("Are you sure you want to resolve this dispute by refunding the escrow hold back to the client?")) return;
    setActingId(id);
    try {
      const updates = {
        status: "declined" as BookingStatus,
        paymentStatus: "refunded" as PaymentStatus,
        updatedAt: new Date().toISOString(),
      };
      await update(ref(database, `bookings/${id}`), updates);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "declined", paymentStatus: "refunded" } : b))
      );
    } catch (err) {
      console.error("Failed to resolve dispute (refund):", err);
    } finally {
      setActingId(null);
    }
  };

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl font-bold text-white">Bookings & Escrow Holds</h1>
            <p className="text-white/70">Inspect system bookings and resolve escrow dispute settlements</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p>No bookings available in the system yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-brand sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-base font-semibold capitalize text-foreground">
                        {b.category}
                      </span>
                      <StatusBadge status={b.status} />
                      <PaymentStatusBadge status={b.paymentStatus || "pending"} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client: </span>
                        <span className="font-medium text-foreground">{b.clientName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Worker: </span>
                        <span className="font-medium text-foreground">{b.workerName}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Scheduled: {new Date(b.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {b.notes && (
                      <p className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground whitespace-pre-line border border-border/30">
                        <strong className="text-foreground">Booking Notes:</strong> {b.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end sm:pl-4">
                    {b.amount && (
                      <p className="text-lg font-bold text-primary">₹{b.amount}</p>
                    )}
                    
                    {/* Admin Actions */}
                    <div className="flex flex-wrap gap-2 justify-end mt-2">
                      {/* Active Dispute Resolution Controls */}
                      {b.paymentStatus === "disputed" && (
                        <>
                          <button
                            id={`btn-admin-dispute-refund-${b.id}`}
                            onClick={() => handleAdminRefundDispute(b.id)}
                            disabled={actingId === b.id}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" /> Refund Client
                          </button>
                          <button
                            id={`btn-admin-dispute-release-${b.id}`}
                            onClick={() => handleAdminReleaseDispute(b.id)}
                            disabled={actingId === b.id}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" /> Release to Worker
                          </button>
                        </>
                      )}

                      {b.status === "pending" && (
                        <>
                          <button
                            id={`btn-admin-accept-${b.id}`}
                            onClick={() => changeStatus(b.id, "accepted")}
                            disabled={actingId === b.id}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            id={`btn-admin-decline-${b.id}`}
                            onClick={() => changeStatus(b.id, "declined")}
                            disabled={actingId === b.id}
                            className="rounded-lg border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      
                      {b.status === "accepted" && b.paymentStatus !== "disputed" && (
                        <button
                          id={`btn-admin-complete-${b.id}`}
                          onClick={() => changeStatus(b.id, "completed")}
                          disabled={actingId === b.id}
                          className="rounded-lg bg-green-605 bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Complete
                        </button>
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

export default AdminBookingsPage;
