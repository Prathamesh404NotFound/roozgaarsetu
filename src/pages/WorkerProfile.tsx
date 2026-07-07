import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Calendar,
  Languages,
  ChefHat,
  Sparkles,
  Baby,
  Heart,
  Shirt,
  Car,
  ArrowLeft,
  Star,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import workersData from "@/data/workers.json";

const serviceIcons: Record<string, React.ElementType> = {
  cooking: ChefHat,
  cleaning: Sparkles,
  childcare: Baby,
  eldercare: Heart,
  laundry: Shirt,
  driving: Car,
};

const serviceLabels: Record<string, string> = {
  cooking: "Cooking",
  cleaning: "Cleaning",
  childcare: "Childcare",
  eldercare: "Elder Care",
  laundry: "Laundry",
  driving: "Driver",
};

const WorkerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const worker = workersData.workers.find((w) => w.id === id);

  if (!worker) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="mb-4 font-heading text-2xl font-bold">Worker Not Found</h1>
          <p className="mb-8 text-muted-foreground">
            The worker you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/workers">Back to Workers</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back Link */}
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <Link
            to="/workers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workers
          </Link>
        </div>
      </div>

      <div className="container py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Profile Header */}
              <div className="mb-8 flex flex-wrap items-start gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 font-heading text-3xl font-bold text-primary">
                  {worker.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-2xl font-bold md:text-3xl">
                      {worker.name}
                    </h1>
                    <VerificationBadge
                      status={
                        (worker as any).verificationStatus ||
                        (worker.verified ? "skill_verified" : "unverified")
                      }
                    />
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {worker.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {worker.experience} experience
                    </span>
                  </div>
                  <RatingStars rating={worker.rating} size="md" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({worker.reviewCount} reviews)
                  </span>
                </div>
              </div>

              {/* Services */}
              <div className="mb-8">
                <h2 className="mb-4 font-heading text-lg font-semibold">Services Offered</h2>
                <div className="flex flex-wrap gap-3">
                  {worker.services.map((service) => {
                    const Icon = serviceIcons[service];
                    return (
                      <span
                        key={service}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 font-medium text-primary"
                      >
                        <Icon className="h-5 w-5" />
                        {serviceLabels[service]}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* About */}
              <div className="mb-8">
                <h2 className="mb-4 font-heading text-lg font-semibold">About</h2>
                <p className="text-muted-foreground">{worker.bio}</p>
              </div>

              {/* Languages */}
              <div className="mb-8">
                <h2 className="mb-4 font-heading text-lg font-semibold">Languages</h2>
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <span>{worker.languages.join(", ")}</span>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-8">
                <h2 className="mb-4 font-heading text-lg font-semibold">Availability</h2>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <span
                      key={day}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        worker.availability.includes(day)
                          ? "bg-success/10 text-success"
                          : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h2 className="mb-4 font-heading text-lg font-semibold">
                  Reviews ({worker.reviews.length})
                </h2>
                <div className="space-y-4">
                  {worker.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{review.user}</span>
                        <RatingStars rating={review.rating} size="sm" showValue={false} />
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-card-hover"
            >
              <div className="mb-6 text-center">
                <div className="mb-1 font-heading text-3xl font-bold text-primary">
                  ₹{worker.hourlyRate}
                </div>
                <div className="text-muted-foreground">per hour</div>
              </div>

              <div className="mb-6 space-y-3">
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
                  <Link to={`/booking?worker=${worker.id}`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Now
                  </Link>
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="tel:+919876543210"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-medium transition-colors hover:bg-muted/50"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-success py-3 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </a>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="space-y-3 border-t border-border pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <Star className="h-4 w-4 text-success" />
                  </div>
                  <span>Police Verified</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <Star className="h-4 w-4 text-success" />
                  </div>
                  <span>Background Checked</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <Star className="h-4 w-4 text-success" />
                  </div>
                  <span>Skill Tested</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkerProfile;
