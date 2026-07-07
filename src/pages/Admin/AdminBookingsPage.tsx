import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, update } from "firebase/database";
import { ArrowLeft, Loader2, Calendar, ClipboardList } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { database } from "@/lib/firebase";
import type { Booking, BookingStatus } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-yellow-105 text-yellow-700 border-yellow-200" },
  accepted:  { label: "Accepted",  className: "bg-blue-105 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-105 text-green-700 border-green-200" },
  declined:  { label: "Declined",  className: "bg-red-105 text-red-700 border-red-200" },
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className || ""}`}>
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

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl font-bold text-white">Bookings</h1>
            <p className="text-white/70">View and manage all system bookings</p>
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
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-base font-semibold capitalize text-foreground">
                        {b.category}
                      </span>
                      <StatusBadge status={b.status} />
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
                      <p className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                        <strong className="text-foreground">Client Notes:</strong> {b.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    {b.amount && (
                      <p className="text-lg font-bold text-primary">₹{b.amount}</p>
                    )}
                    
                    {/* Admin Actions */}
                    <div className="flex gap-2">
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
                      
                      {b.status === "accepted" && (
                        <button
                          id={`btn-admin-complete-${b.id}`}
                          onClick={() => changeStatus(b.id, "completed")}
                          disabled={actingId === b.id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
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
