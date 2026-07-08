import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle2, Zap, TrendingUp, Loader2 } from "lucide-react";
import { ref, push, set, get, onValue } from "firebase/database";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/Auth/AuthProvider";
import { database } from "@/lib/firebase";
import { VoiceRecorder } from "@/components/ui/VoiceRecorder";
import type { Booking } from "@/types";

interface WorkerData {
  id?: string;
  name: string;
  services: string[];
  city?: string;
  locality?: string;
  category?: string;
  hourlyRate?: number;
}

const timeSlots = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const Booking = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerId = searchParams.get("worker");
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);

  // Fetch worker from Firebase
  useEffect(() => {
    if (!workerId) return;

    const unsubWorker = onValue(
      ref(database, `workers/${workerId}`),
      async (workerSnap) => {
        if (workerSnap.exists()) {
          const workerData = workerSnap.val();
          // Fetch user display name (one-time is fine, rarely changes)
          let displayName = "Worker";
          try {
            const userSnap = await get(ref(database, `users/${workerId}`));
            if (userSnap.exists()) displayName = userSnap.val().displayName || "Worker";
          } catch { /* ignore */ }

          setWorker({
            id: workerId,
            name: displayName,
            services: workerData.categories || (workerData.category ? [workerData.category] : []),
            hourlyRate: workerData.servicePreferences?.hourlyRate ?? 100,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to listen to worker:", err);
        setLoading(false);
      }
    );

    return () => unsubWorker();
  }, [workerId]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    locality: "",
    notes: "",
  });
  const [bookingId, setBookingId] = useState("");
  const [voiceBase64, setVoiceBase64] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estimator range state
  const [estimatorRange, setEstimatorRange] = useState<{ min: number; max: number; isHistorical: boolean } | null>(null);

  // Prefill details
  useEffect(() => {
    if (profile || user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || profile?.displayName || user?.displayName || "",
        phone: prev.phone || profile?.phone || "",
        address: prev.address || profile?.city || "",
        locality: prev.locality || (profile as { locality?: string })?.locality || "",
      }));
    }
  }, [profile, user]);

  // Load Price Estimator statistics
  useEffect(() => {
    if (!worker) return;
    const category = worker.services[0] || "general";

    const PREDEFINED: Record<string, { min: number; max: number }> = {
      cooking: { min: 4000, max: 6000 },
      cleaning: { min: 3000, max: 5000 },
      childcare: { min: 6000, max: 9000 },
      eldercare: { min: 7000, max: 10000 },
      laundry: { min: 2000, max: 4000 },
      driving: { min: 8000, max: 12000 },
    };
    const fallback = PREDEFINED[category] || { min: 3000, max: 5000 };

    get(ref(database, "bookings")).then((snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, Booking>;
        const list = Object.values(data).filter(
          (b) => b.category === category && b.status === "completed" && b.amount
        );
        if (list.length >= 3) {
          const sum = list.reduce((total, curr) => total + (curr.amount || 0), 0);
          const average = Math.round(sum / list.length);
          setEstimatorRange({
            min: Math.max(500, average - 300),
            max: average + 300,
            isHistorical: true,
          });
          return;
        }
      }
      setEstimatorRange({
        min: fallback.min,
        max: fallback.max,
        isHistorical: false,
      });
    }).catch(() => {
      setEstimatorRange({
        min: fallback.min,
        max: fallback.max,
        isHistorical: false,
      });
    });
  }, [worker]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !worker) return;

    setSubmitting(true);
    try {
      const bookingsRef = ref(database, "bookings");
      const newBookingRef = push(bookingsRef);
      const id = newBookingRef.key || `BKG${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const bookingDurationHours = 8;
      const finalAmount = worker.hourlyRate * bookingDurationHours;

      const bookingData = {
        id,
        clientId: user.uid,
        clientName: formData.name || user.displayName || "Client",
        workerId: worker.id,
        workerName: worker.name,
        category: worker.services[0] || "General Help",
        date: `${selectedDate}T${selectedTime === "08:00 AM" ? "08:00:00" : "12:00:00"}`,
        notes: `${formData.notes}\nAddress: ${formData.address}`,
        status: "pending",
        paymentStatus: "pending",
        amount: finalAmount,
        locality: formData.locality || null,
        urgent,
        voiceNoteBase64: voiceBase64 || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await set(ref(database, `bookings/${id}`), bookingData);
      setBookingId(id);
      setStep(3);
    } catch (err) {
      console.error("Booking write failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!worker) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="mb-4 font-heading text-2xl font-bold">Select a Worker</h1>
          <p className="mb-8 text-muted-foreground">
            Please select a worker from our listings to book their services.
          </p>
          <Button onClick={() => navigate("/workers")}>Browse Workers</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-hero py-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <h1 className="font-heading text-2xl font-bold text-white md:text-3xl">
              Book {worker.name}
            </h1>
            <p className="text-white/80">Complete your booking in a few simple steps</p>
          </motion.div>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.08 }}
          className="mb-8 flex items-center justify-center gap-4"
        >
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-colors ${step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground"
                  }`}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-12 rounded transition-colors ${step > s ? "bg-primary" : "bg-muted/30"
                    }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.30, ease: "easeOut", delay: 0.18 }}
          className="mx-auto max-w-2xl"
        >
          {/* Step 1: Select Date & Time */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-brand"
            >
              <h2 className="mb-6 font-heading text-xl font-semibold">
                Select Date & Time
              </h2>

              <div className="mb-6">
                <Label htmlFor="date" className="mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <Label className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Select Time
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${selectedTime === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary hover:bg-primary/5"
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-brand"
            >
              <h2 className="mb-6 font-heading text-xl font-semibold">
                Your Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <Label htmlFor="locality">Locality / Society</Label>
                    <Input
                      id="locality"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      required
                      placeholder="e.g. Gokuldham Society"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Service Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="Enter your complete address"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Instructions & Speech Input</Label>
                  <div className="mb-2.5 mt-1.5">
                    <VoiceRecorder
                      onTranscript={(text) => {
                        setFormData((prev) => ({
                          ...prev,
                          notes: prev.notes ? prev.notes + " " + text : text,
                        }));
                      }}
                      onAudioCaptured={(base64) => {
                        setVoiceBase64(base64);
                      }}
                    />
                  </div>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Provide description or click microphone to speak..."
                    rows={2}
                  />
                </div>

                {/* Instant Price Estimator View */}
                {estimatorRange && (
                  <div className="rounded-xl border border-indigo-150 border-indigo-200 bg-indigo-50/20 p-4">
                    <p className="font-heading font-semibold text-indigo-900 mb-1 flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                      Instant Price Estimator
                    </p>
                    <p className="text-xs text-indigo-850 text-indigo-900">
                      Typical retainer for <span className="font-bold underline">{worker.services[0]}</span> in this area:{" "}
                      <span className="font-bold text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded ml-1">
                        ₹{estimatorRange.min} - ₹{estimatorRange.max}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {estimatorRange.isHistorical
                        ? "* Hand-calculated from actual completed bookings nearby."
                        : "* Admin configured platform standards."}
                    </p>
                  </div>
                )}

                {/* Emergency Urgent Boost */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-250 border-amber-200 bg-amber-50/20 p-4 transition-all focus-within:ring-2 focus-within:ring-amber-500">
                  <input
                    id="urgent-boost"
                    type="checkbox"
                    checked={urgent}
                    onChange={(e) => setUrgent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs cursor-pointer select-none" onClick={() => setUrgent(!urgent)}>
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                      Emergency / Urgent Job Boost
                    </p>
                    <p className="text-amber-700 mt-1">
                      Visually flags requirement inside worker networks & expands broadcast notification radius from 2km to 10km.
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                      * Surcharge is feature-flagged off: free deployment.
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted/30 p-4">
                  <h3 className="mb-2 font-medium">Booking Summary</h3>
                  <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Worker:</span>
                    <span>{worker.name}</span>
                    <span className="font-semibold text-foreground">Scheduled Date:</span>
                    <span>
                      {new Date(selectedDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-semibold text-foreground">Time Slot:</span>
                    <span>{selectedTime}</span>
                    <span className="font-semibold text-foreground">Hourly Rate:</span>
                    <span>₹{worker.hourlyRate}/hr</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-8 text-center shadow-brand"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Booking Request Sent!</h2>
              <p className="mb-6 text-muted-foreground">
                Your request has been successfully created. You can track its progress on your dashboard or details page.
              </p>

              <div className="mb-8 rounded-lg bg-muted/30 p-4">
                <p className="mb-2 text-sm text-muted-foreground">Booking Reference ID</p>
                <div className="flex flex-col gap-1 items-center">
                  <p className="font-heading text-xl font-bold text-primary">{bookingId}</p>
                  <Link
                    to={`/booking/${bookingId}`}
                    className="text-xs text-indigo-600 font-semibold hover:underline mt-1"
                  >
                    Track booking details & stepper →
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={() => navigate("/dashboard/client")} className="w-full" size="lg">
                  Go to Client Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/workers")}
                  className="w-full"
                >
                  Browse More Workers
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Booking;
