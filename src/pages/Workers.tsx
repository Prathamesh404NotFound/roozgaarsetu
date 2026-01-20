import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, ChefHat, Sparkles, Baby, Heart, Shirt, Car } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Workers = () => {
  const [searchParams] = useSearchParams();
  const initialService = searchParams.get("service") || "";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedLocation, setSelectedLocation] = useState("");

  const filteredWorkers = useMemo(() => {
    return workersData.workers.filter((worker) => {
      const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.bio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = !selectedService || worker.services.includes(selectedService);
      const matchesLocation = !selectedLocation || worker.location.toLowerCase().includes(selectedLocation.toLowerCase());
      return matchesSearch && matchesService && matchesLocation;
    });
  }, [searchTerm, selectedService, selectedLocation]);

  const services = ["cooking", "cleaning", "childcare", "eldercare", "laundry", "driving"];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero py-12 lg:py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="mb-4 font-heading text-3xl font-bold text-white md:text-4xl">
              Find Verified Workers
            </h1>
            <p className="text-lg text-white/80">
              Browse through our verified domestic help professionals
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card py-6">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Location */}
            <div className="relative min-w-[160px]">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Service Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedService === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedService("")}
              >
                All
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
                    <span className="hidden sm:inline">{serviceLabels[service]}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{filteredWorkers.length}</span> workers found
            </p>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Sort by Rating
            </Button>
          </div>

          {filteredWorkers.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredWorkers.map((worker) => (
                <motion.div key={worker.id} variants={itemVariants}>
                  <Link
                    to={`/worker/${worker.id}`}
                    className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                  >
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-bold text-primary">
                          {worker.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-semibold">
                            {worker.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {worker.location}
                          </div>
                        </div>
                      </div>
                      {worker.verified && <VerificationBadge size="sm" />}
                    </div>

                    {/* Services */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {worker.services.map((service) => {
                        const Icon = serviceIcons[service];
                        return (
                          <span
                            key={service}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          >
                            <Icon className="h-3 w-3" />
                            {serviceLabels[service]}
                          </span>
                        );
                      })}
                    </div>

                    {/* Bio */}
                    <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
                      {worker.bio}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <RatingStars rating={worker.rating} size="sm" />
                        <div className="text-xs text-muted-foreground">
                          {worker.reviewCount} reviews
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-lg font-bold text-primary">
                          ₹{worker.hourlyRate}
                        </div>
                        <div className="text-xs text-muted-foreground">per hour</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-heading text-xl font-semibold">No Workers Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find more results.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Workers;
