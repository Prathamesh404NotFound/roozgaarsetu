import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import workersData from "@/data/workers.json";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerId = searchParams.get("worker");
  const worker = workersData.workers.find((w) => w.id === workerId);

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [bookingId, setBookingId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate booking creation
    const id = `BKG${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setBookingId(id);
    setStep(3);
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
          <h1 className="font-heading text-2xl font-bold text-white md:text-3xl">
            Book {worker.name}
          </h1>
          <p className="text-white/80">Complete your booking in a few simple steps</p>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-colors ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-12 rounded transition-colors ${
                    step > s ? "bg-primary" : "bg-muted/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-2xl">
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
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        selectedTime === time
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

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requirements or instructions"
                    rows={2}
                  />
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted/30 p-4">
                  <h3 className="mb-2 font-medium">Booking Summary</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Worker:</strong> {worker.name}</p>
                    <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Rate:</strong> ₹{worker.hourlyRate}/hr</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    Confirm Booking
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
              <h2 className="mb-2 font-heading text-2xl font-bold">Booking Confirmed!</h2>
              <p className="mb-6 text-muted-foreground">
                Your booking has been successfully placed. We'll send you a confirmation shortly.
              </p>

              <div className="mb-8 rounded-lg bg-muted/30 p-4">
                <p className="mb-2 text-sm text-muted-foreground">Booking Reference</p>
                <p className="font-heading text-xl font-bold text-primary">{bookingId}</p>
              </div>

              <div className="space-y-3">
                <Button onClick={() => navigate("/")} className="w-full" size="lg">
                  Back to Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/workers")}
                  className="w-full"
                >
                  Book Another Service
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Booking;
