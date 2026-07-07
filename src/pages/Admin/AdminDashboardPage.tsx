import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get } from "firebase/database";
import { Users, Briefcase, CalendarDays, Loader2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { database } from "@/lib/firebase";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    clients: 0,
    workers: 0,
    bookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, workersSnap, bookingsSnap] = await Promise.all([
          get(ref(database, "users")),
          get(ref(database, "workers")),
          get(ref(database, "bookings")),
        ]);

        let clientsCount = 0;
        let workersCount = 0;

        if (usersSnap.exists()) {
          const usersObj = usersSnap.val();
          Object.values(usersObj).forEach((u: any) => {
            if (u.role === "client") clientsCount++;
            if (u.role === "worker") workersCount++;
          });
        } else {
          // fallback to workers node if users has no details or is empty
          if (workersSnap.exists()) {
            workersCount = Object.keys(workersSnap.val()).length;
          }
        }

        const bookingsCount = bookingsSnap.exists()
          ? Object.keys(bookingsSnap.val()).length
          : 0;

        setStats({
          clients: clientsCount,
          workers: workersCount,
          bookings: bookingsCount,
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-heading text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-white/70">Overview of RoozgaarSetu users and bookings</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Clients Stat */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-blue-500" />
                    <span className="text-sm font-medium text-muted-foreground">Total Clients</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-foreground">{stats.clients}</p>
                </div>

                {/* Workers Stat */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                  <div className="flex items-center justify-between">
                    <Briefcase className="h-8 w-8 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Total Workers</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-foreground">{stats.workers}</p>
                </div>

                {/* Bookings Stat */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
                  <div className="flex items-center justify-between">
                    <CalendarDays className="h-8 w-8 text-purple-500" />
                    <span className="text-sm font-medium text-muted-foreground">Total Bookings</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-foreground">{stats.bookings}</p>
                </div>
              </div>

              {/* Navigation Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                <Link
                  to="/admin/users"
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-brand"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Manage Users</h3>
                    <p className="text-xs text-muted-foreground">Search and view roles of all registered users</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>

                <Link
                  to="/admin/workers"
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-brand"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Verify Workers</h3>
                    <p className="text-xs text-muted-foreground">Toggle verification statuses for workers</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>

                <Link
                  to="/admin/bookings"
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-brand"
                >
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Manage Bookings</h3>
                    <p className="text-xs text-muted-foreground">View and manage client-worker bookings</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboardPage;
