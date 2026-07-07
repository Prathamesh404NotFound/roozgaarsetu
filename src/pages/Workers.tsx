import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChefHat, Sparkles, Baby, Heart, Shirt, Car, Users, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { useAuth } from "@/components/Auth/AuthProvider";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useTranslation } from "react-i18next";
import type { Booking, WorkerRecord } from "@/types";

const serviceIcons: Record<string, React.ElementType> = {
  cooking: ChefHat,
  cleaning: Sparkles,
  childcare: Baby,
  eldercare: Heart,
  laundry: Shirt,
  driving: Car,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Workers = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const initialService = searchParams.get("service") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [nearbyHireCount, setNearbyHireCount] = useState<Record<string, number>>({});
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch workers from Firebase
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const [workersSnap, usersSnap] = await Promise.all([
          get(ref(database, "workers")),
          get(ref(database, "users"))
        ]);

        if (workersSnap.exists()) {
          const workersData = workersSnap.val();
          const usersData = usersSnap.exists() ? usersSnap.val() : {};

          const workersList = Object.entries(workersData).map(([uid, w]: [string, any]) => {
            const user = usersData[uid] || {};
            return {
              id: uid,
              name: user.displayName || "Worker",
              services: w.categories || [w.category],
              rating: 4.5, // Default rating since not in DB
              reviewCount: 0,
              verified: w.isVerified || false,
              verificationStatus: w.verificationStatus,
              hourlyRate: 100, // Default rate
              location: w.city || w.locality || "Pune",
              experience: w.experience || "0 years",
              bio: w.bio || "Professional worker",
              availability: w.availability
            };
          });

          setWorkers(workersList);
        }
      } catch (err) {
        console.error("Failed to fetch workers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  useEffect(() => {
    const clientLocality = (profile as any)?.locality?.trim().toLowerCase();
    if (!clientLocality) return;
    get(ref(database, "bookings")).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Booking>;
      const counts: Record<string, number> = {};
      Object.values(data).forEach((b) => {
        if (b.status === "completed" && b.locality?.trim().toLowerCase() === clientLocality) {
          counts[b.workerId] = (counts[b.workerId] || 0) + 1;
        }
      });
      setNearbyHireCount(counts);
    }).catch(() => { });
  }, [profile]);

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesSearch =
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.bio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = !selectedService || worker.services.includes(selectedService);
      const matchesLocation = !selectedLocation || worker.location.toLowerCase().includes(selectedLocation.toLowerCase());
      return matchesSearch && matchesService && matchesLocation;
    });
  }, [searchTerm, selectedService, selectedLocation, workers]);

  const services = ["cooking", "cleaning", "childcare", "eldercare", "laundry", "driving"];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero py-10 lg:py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="mb-3 font-heading text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              {t("workers.title")}
            </h1>
            <p className="text-base text-white/80 sm:text-lg">{t("workers.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card py-4 sm:py-6">
        <div className="container">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("workers.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Location */}
            <div className="relative sm:min-w-[160px]">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("workers.locationPlaceholder")}
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Service Filter */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={selectedService === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedService("")}
              >
                {t("workers.all")}
              </Button>
              {services.map((service) => {
                const Icon = serviceIcons[service];
                return (
                  <Button
                    key={service}
                    variant={selectedService === service ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedService(service)}
                    className="gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t(`services.${service}`)}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10 lg:py-14">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">{filteredWorkers.length}</span> {t("workers.workersFound", { count: filteredWorkers.length })}
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {t("workers.sortByRating")}
                </Button>
              </div>

              {filteredWorkers.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredWorkers.map((worker) => (
                    <motion.div key={worker.id} variants={itemVariants}>
                      <Link
                        to={`/worker/${worker.id}`}
                        className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-lg sm:text-xl font-bold text-primary">
                              {worker.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-heading text-base sm:text-lg font-semibold truncate">{worker.name}</h3>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{worker.location}</span>
                              </div>
                              {nearbyHireCount[worker.id] > 0 && (
                                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-100">
                                  <Users className="h-2.5 w-2.5" />
                                  {t("workers.hiredNearby", { count: nearbyHireCount[worker.id] })}
                                </span>
                              )}
                            </div>
                          </div>
                          <VerificationBadge
                            size="sm"
                            status={(worker as any).verificationStatus || (worker.verified ? "id_verified" : "unverified")}
                          />
                        </div>

                        {/* Services */}
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {worker.services.map((service) => {
                            const Icon = serviceIcons[service];
                            return (
                              <span
                                key={service}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                              >
                                <Icon className="h-3 w-3" />
                                {t(`services.${service}`)}
                              </span>
                            );
                          })}
                        </div>

                        {/* Bio */}
                        <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">{worker.bio}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <div>
                            <RatingStars rating={worker.rating} size="sm" />
                            <div className="text-xs text-muted-foreground">
                              {worker.reviewCount} {t("workers.reviews")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-heading text-lg font-bold text-primary">₹{worker.hourlyRate}</div>
                            <div className="text-xs text-muted-foreground">{t("workers.perHour")}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-10 sm:p-12 text-center">
                  <Search className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-heading text-lg sm:text-xl font-semibold">{t("workers.noWorkersTitle")}</h3>
                  <p className="text-muted-foreground text-sm">{t("workers.noWorkersDesc")}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Workers;
