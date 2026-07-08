import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, update } from "firebase/database";
import {
  CheckCircle2, Clock, Loader2, User, Briefcase, AlertTriangle,
  CreditCard, Wallet, RotateCcw, Zap, Mic, ArrowLeft, Lock, ShieldCheck
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import type { Booking, BookingStatus, PaymentStatus } from "@/types";

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { key: "posted", label: "Posted", description: "Job request submitted", icon: Briefcase },
  { key: "accepted", label: "Accepted", description: "Worker confirmed the request", icon: User },
  { key: "in_progress", label: "In Progress", description: "Funds held in escrow & work started", icon: Lock },
  { key: "completed", label: "Completed", description: "Work finished, awaiting payment", icon: CheckCircle2 },
  { key: "paid", label: "Paid", description: "Payment released to worker", icon: ShieldCheck },
];

function getActiveStep(b: Booking): number {
  if (b.paymentStatus === "released" || b.paymentStatus === "refunded") return 4; // Paid / resolved
  if (b.status === "completed") return 3;
  if (b.paymentStatus === "held" && b.status === "accepted") return 2; // In progress
  if (b.status === "accepted") return 1;
  return 0; // pending = posted
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  completed: "Completed",
  declined: "Declined",
};

const PAY_LABEL: Record<PaymentStatus, string> = {
  pending: "No Escrow Deposit",
  held: "Escrow Held",
  released: "Released to Worker",
  refunded: "Refunded to Client",
  disputed: "Disputed",
};

// ─── Component ────────────────────────────────────────────────────────────────

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Escrow payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payState, setPayState] = useState<"idle" | "processing" | "success">("idle");

  const fetchBooking = () => {
    if (!id) return;
    get(ref(database, `bookings/${id}`)).then((snap) => {
      if (snap.exists()) {
        setBooking({ ...snap.val(), id: snap.key } as Booking);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const isClient = user?.uid === booking?.clientId;
  const isWorker = user?.uid === booking?.workerId;
  const isAdmin = profile?.role === "admin";

  // ── Actions ────────────────────────────────────────────────────────────────

  const updateBooking = async (updates: Partial<Booking>) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await update(ref(database, `bookings/${id}`), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      fetchBooking();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscrowDeposit = async () => {
    setPayState("processing");
    // Simulated gateway — swap with Razorpay script in production
    setTimeout(async () => {
      await update(ref(database, `bookings/${id}`), {
        paymentStatus: "held" as PaymentStatus,
        updatedAt: new Date().toISOString(),
      });
      setPayState("success");
      setTimeout(() => {
        setShowPayModal(false);
        setPayState("idle");
        fetchBooking();
      }, 1500);
    }, 2000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Booking Not Found</h1>
          <p className="text-muted-foreground mb-6">The booking ID <code className="font-mono bg-muted px-2 py-0.5 rounded">{id}</code> does not exist.</p>
          <button onClick={() => navigate(-1)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const activeStep = getActiveStep(booking);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white mb-3">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-white capitalize">
                {booking.category} Booking
              </h1>
              {booking.urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-200 animate-pulse">
                  <Zap className="h-3 w-3" /> URGENT
                </span>
              )}
            </div>
            <p className="text-white/70 mt-1 text-sm font-mono"># {booking.id}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left column: Stepper + Actions ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual 5-step status stepper */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
              <h2 className="font-heading text-lg font-semibold mb-6">Job Status Tracker</h2>
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />

                <div className="space-y-6">
                  {STEPS.map((step, idx) => {
                    const isDone = idx < activeStep;
                    const isCurrent = idx === activeStep;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        {/* Step circle */}
                        <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${isDone ? "bg-primary border-primary text-primary-foreground" :
                            isCurrent ? "bg-primary/10 border-primary text-primary animate-pulse" :
                              "bg-card border-border text-muted-foreground"
                          }`}>
                          {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                        </div>

                        <div className="pt-1.5">
                          <p className={`font-semibold text-sm ${isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-brand space-y-3">
              <h2 className="font-heading text-lg font-semibold mb-4">Actions</h2>

              {/* Worker: accept/decline if pending */}
              {isWorker && booking.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => updateBooking({ status: "accepted" as BookingStatus })}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Accept Job
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => updateBooking({ status: "declined" as BookingStatus })}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-destructive text-destructive px-4 py-2.5 text-sm font-semibold hover:bg-destructive/5 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}

              {/* Client: pay escrow */}
              {isClient && booking.status === "accepted" && (booking.paymentStatus === "pending" || !booking.paymentStatus) && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <CreditCard className="h-4 w-4" /> Pay Escrow Hold (₹{booking.amount})
                </button>
              )}

              {/* Client: release funds */}
              {isClient && booking.paymentStatus === "held" && (
                <div className="flex gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      const reason = prompt("Reason for dispute (required):");
                      if (!reason) return;
                      updateBooking({
                        paymentStatus: "disputed" as PaymentStatus,
                        notes: (booking.notes || "") + `\n[DISPUTE]: ${reason}`,
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 px-4 py-2.5 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" /> Raise Dispute
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      if (!confirm("Release funds to the worker? This is irreversible.")) return;
                      updateBooking({
                        status: "completed" as BookingStatus,
                        paymentStatus: "released" as PaymentStatus,
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Release Payment
                  </button>
                </div>
              )}

              {/* Worker: mark complete */}
              {isWorker && booking.status === "accepted" && booking.paymentStatus === "held" && (
                <button
                  disabled={actionLoading}
                  onClick={() => updateBooking({ status: "completed" as BookingStatus })}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark Work as Complete
                </button>
              )}

              {/* Admin: dispute resolution */}
              {isAdmin && booking.paymentStatus === "disputed" && (
                <div className="flex gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => updateBooking({ paymentStatus: "refunded" as PaymentStatus, status: "declined" as BookingStatus })}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Refund Client
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => updateBooking({ paymentStatus: "released" as PaymentStatus, status: "completed" as BookingStatus })}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Release to Worker
                  </button>
                </div>
              )}

              {/* No-op states */}
              {booking.status === "declined" && (
                <p className="text-center text-sm text-muted-foreground">This booking was declined.</p>
              )}
              {booking.paymentStatus === "released" && (
                <p className="text-center text-sm font-semibold text-emerald-600">✓ Payment has been released. Job complete.</p>
              )}
              {booking.paymentStatus === "refunded" && (
                <p className="text-center text-sm font-semibold text-zinc-600">↩ Funds have been refunded to the client.</p>
              )}
              {booking.paymentStatus === "disputed" && !isAdmin && (
                <p className="text-center text-sm text-amber-700">⚠ Dispute filed — under admin review.</p>
              )}
            </div>

            {/* Voice note player (if available) */}
            {booking.voiceNoteBase64 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                <h3 className="font-heading font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Mic className="h-4 w-4 text-primary" /> Client Voice Instruction
                </h3>
                <audio
                  controls
                  src={booking.voiceNoteBase64}
                  className="w-full rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">Recorded by the client at booking time.</p>
              </div>
            )}
          </div>

          {/* ── Right column: Booking metadata ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-brand">
              <h3 className="font-heading text-base font-semibold mb-4">Booking Details</h3>
              <dl className="space-y-3 text-sm">
                {[
                  { label: "Category", value: booking.category },
                  { label: "Client", value: booking.clientName },
                  { label: "Worker", value: booking.workerName },
                  { label: "Date", value: new Date(booking.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) },
                  { label: "Amount", value: booking.amount ? `₹${booking.amount}` : "—" },
                  { label: "Locality", value: booking.locality || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Statuses */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-brand">
              <h3 className="font-heading text-base font-semibold mb-4">Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Booking</span>
                  <span className="font-semibold capitalize">{STATUS_LABEL[booking.status]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold capitalize">{PAY_LABEL[booking.paymentStatus || "pending"]}</span>
                </div>
                {booking.urgent && (
                  <div className="flex items-center gap-1.5 mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700">
                    <Zap className="h-3.5 w-3.5 animate-pulse" /> Urgent — Widened dispatch radius
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-brand">
                <h3 className="font-heading text-base font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Escrow payment modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <h3 className="font-heading text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-600" /> Escrow Deposit
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Funds held securely — released only on your approval.</p>

            {payState === "idle" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 text-sm space-y-2 text-indigo-900">
                  <div className="flex justify-between font-medium">
                    <span>Service:</span><span>₹{(booking.amount || 0) - 100}</span>
                  </div>
                  <div className="flex justify-between text-xs text-indigo-700">
                    <span>Escrow Guard:</span><span>₹100</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-2 flex justify-between font-bold text-base">
                    <span>Total Hold:</span><span>₹{booking.amount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPayModal(false)} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-muted transition">Cancel</button>
                  <button onClick={handleEscrowDeposit} className="flex-1 rounded-xl bg-indigo-600 text-white py-2.5 text-xs font-bold hover:bg-indigo-700 transition">Deposit & Hold</button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground italic">* Sandbox mode — no real transactions.</p>
              </div>
            )}
            {payState === "processing" && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-sm font-semibold">Processing escrow lock…</p>
              </div>
            )}
            {payState === "success" && (
              <div className="py-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
                <p className="text-sm font-bold text-emerald-600">Escrow Locked!</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default BookingDetail;
